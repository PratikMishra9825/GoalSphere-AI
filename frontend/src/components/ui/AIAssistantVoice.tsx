"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  X, 
  ArrowRight,
  MessageSquare,
  Volume1,
  HelpCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }
}

export function AIAssistantVoice() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [responseHtml, setResponseHtml] = useState<string>("Hello! I am your GoalSphere Voice Intelligence. Tap the microphone and speak, or type a question to get context-aware answers about your tasks and workload.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userRole, setUserRole] = useState("employee");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-detect role for adaptive glassmorphic theme styling
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role) {
      setUserRole(role.toLowerCase());
    }
  }, [isOpen]);

  // Accent selector: Indigo for HR, Amber for others
  const isHR = userRole === "hr";
  const themeAccent = isHR ? "text-indigo-400 border-indigo-500/20 bg-indigo-500" : "text-amber-500 border-amber-500/20 bg-amber-500";
  const themeRing = isHR ? "focus-visible:ring-indigo-500" : "focus-visible:ring-amber-500";
  const themeGlow = isHR ? "shadow-indigo-500/20" : "shadow-amber-500/20";
  const themeBadge = isHR ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500";

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
          setQueryText("");
          // Stop synthesis if currently speaking
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        };

        rec.onresult = (e: SpeechRecognitionEvent) => {
          const transcript = e.results[0][0].transcript;
          setQueryText(transcript);
          handleSubmitQuery(transcript);
        };

        rec.onerror = (e: SpeechRecognitionErrorEvent) => {
          console.error("Speech Recognition Error:", e.error);
          if (e.error !== "no-speech") {
            toast.error("Microphone Access Error", { description: "Please verify mic permissions in your browser settings." });
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech browser synthesis handler
  const speakAloud = (text: string) => {
    if (typeof window === "undefined" || isMuted) return;

    window.speechSynthesis.cancel(); // Stop active voices

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    // Detect voices and set to premium natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.lang.startsWith("en") && 
      (v.name.includes("Google US English") || v.name.includes("Natural") || v.name.includes("English"))
    );
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Web Speech Not Supported", { description: "Your browser does not support Speech Recognition. Please type your query." });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition already running", err);
      }
    }
  };

  // Dispatch API Call to backend with role-awareness
  const handleSubmitQuery = async (queryToSubmit: string) => {
    if (!queryToSubmit.trim()) return;
    setIsAnalyzing(true);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Session Expired", { description: "Please log in to query the AI assistant." });
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/ai/voice-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: queryToSubmit })
      });

      if (!res.ok) throw new Error("Voice Assistant Endpoint Failed");

      const data = await res.json();
      setResponseHtml(data.response);
      speakAloud(data.response);
    } catch (error) {
      console.error("AI Assistant Ingestion Error:", error);
      const fallback = "I encountered an error querying my backend networks. Please make sure the backend server is running.";
      setResponseHtml(fallback);
      speakAloud(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    handleSubmitQuery(queryText);
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsListening(false);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {/* Dynamic Conversational UI Portal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-[340px] sm:w-[380px] bg-slate-950/90 border border-slate-800/80 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl mb-4 flex flex-col ring-1 ring-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60 bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${themeGlow} bg-gradient-to-br from-indigo-500 to-violet-600`}>
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    GoalSphere AI Voice
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Intelligence</span>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Response Area */}
            <div className="p-5 flex-1 min-h-[140px] max-h-[220px] overflow-y-auto space-y-4 no-scrollbar">
              <div className="space-y-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border rounded-full ${themeBadge} inline-block`}>
                  Cognitive Feeds
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {responseHtml}
                </p>
              </div>

              {/* Dynamic Waveform Visualizer */}
              {(isListening || isSpeaking || isAnalyzing) && (
                <div className="flex items-center justify-center gap-1 h-8 py-1.5">
                  {[...Array(9)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isListening 
                          ? [6, 24, 6] 
                          : isSpeaking 
                          ? [6, 18, 6] 
                          : [6, 10, 6]
                      }}
                      transition={{
                        duration: isListening ? 0.6 : isSpeaking ? 0.9 : 1.2,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                      className={`w-1 rounded-full ${isHR ? "bg-indigo-500" : "bg-amber-500"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Context Prompts */}
            <div className="px-4 pb-2 border-t border-slate-800/40 pt-3 bg-black/20">
              <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Suggested Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Show my tasks for today",
                  "How is my performance this week?",
                  "Summarize team workload"
                ].map((sQuery) => (
                  <button
                    key={sQuery}
                    onClick={() => {
                      setQueryText(sQuery);
                      handleSubmitQuery(sQuery);
                    }}
                    type="button"
                    className="text-[10px] text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 px-2.5 py-1 rounded-full transition-all cursor-pointer truncate max-w-[240px]"
                  >
                    {sQuery}
                  </button>
                ))}
              </div>
            </div>

            {/* Input form */}
            <div className="p-4 border-t border-slate-800/60 bg-black/40">
              <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Type or speak your question..."}
                    disabled={isListening}
                    className={`w-full bg-slate-950/80 border border-slate-800 text-xs text-white rounded-xl py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-1 focus:border-transparent ${themeRing} disabled:opacity-50`}
                  />
                  <button
                    type="button"
                    onClick={handleToggleListening}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors cursor-pointer ${
                      isListening 
                        ? "text-red-500 hover:bg-red-500/10" 
                        : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                
                {/* Mute toggle for TTS */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (!isMuted && typeof window !== "undefined") {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  className={`p-2.5 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-center cursor-pointer ${
                    isMuted 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                  title={isMuted ? "Unmute Voice Out" : "Mute Voice Out"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isAnalyzing || !queryText.trim()}
                  className={`p-2.5 rounded-xl transition-all font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 ${
                    isHR 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                      : "bg-amber-500 hover:bg-amber-600 text-black"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Activation Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer shadow-xl ${themeGlow} relative group overflow-hidden ${
          isHR 
            ? "bg-gradient-to-br from-indigo-500 to-violet-600" 
            : "bg-gradient-to-br from-amber-500 to-orange-600"
        }`}
      >
        {/* Glow pulsing ambient rings */}
        <div className={`absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        {isListening ? (
          <MicOff className="w-5.5 h-5.5 animate-pulse text-red-200" />
        ) : (
          <Sparkles className="w-5.5 h-5.5 text-white" />
        )}
      </motion.button>
    </div>
  );
}
