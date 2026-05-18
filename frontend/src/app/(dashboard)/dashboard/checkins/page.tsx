"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Award,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function CheckinsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // New Check-in Form States
  const [actualAchievement, setActualAchievement] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Safe fallback / mock data for demo if not logged in
        setGoals(getDemoGoals());
        setLoading(false);
        return;
      }
      const res = await fetch(`${getBackendUrl()}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Fall back to demo data if the user has no goals
        if (data.length === 0) {
          setGoals(getDemoGoals());
        } else {
          setGoals(data);
        }
      } else {
        setGoals(getDemoGoals());
      }
    } catch (err) {
      console.warn("Could not fetch real goals, falling back to dynamic mockup data", err);
      setGoals(getDemoGoals());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const getDemoGoals = () => [
    {
      _id: "demo-1",
      title: "Enhance Gemini Engine Precision",
      description: "Optimize PDF generation & Weekly intelligence report accuracy metrics to >98% success rate.",
      targetValue: 98,
      uom: "Percentage",
      weightage: 40,
      status: "Approved",
      thrustArea: "AI & Innovation",
      checkIns: [
        { quarter: "Q1", actualAchievement: 85, progressNotes: "Gemini integration finalized.", date: new Date().toISOString() }
      ]
    },
    {
      _id: "demo-2",
      title: "Reduce API Latency Overhead",
      description: "Lower average serverless function response time to under 150ms under peak load.",
      targetValue: 150,
      uom: "Numeric",
      weightage: 30,
      status: "Approved",
      thrustArea: "Infrastructure Resilience",
      checkIns: []
    },
    {
      _id: "demo-3",
      title: "Workforce Simulation UI Polish",
      description: "Deploy interactive Framer-motion graphs & high fidelity glassmorphic sidebar options.",
      targetValue: 100,
      uom: "Percentage",
      weightage: 30,
      status: "Approved",
      thrustArea: "User Experience Excellence",
      checkIns: [
        { quarter: "Q1", actualAchievement: 50, progressNotes: "Primary viewports established.", date: new Date().toISOString() },
        { quarter: "Q2", actualAchievement: 90, progressNotes: "Completed sidebar transition styling.", date: new Date().toISOString() }
      ]
    }
  ];

  const handleSubmitCheckin = async (goalId: string) => {
    if (!actualAchievement) {
      toast.error("Please specify your current achievement metrics.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Simulating checkin for mock data
        setTimeout(() => {
          setGoals(prev => prev.map(g => {
            if (g._id === goalId) {
              const updatedCheckIns = [...(g.checkIns || [])];
              updatedCheckIns.push({
                quarter: "Q2",
                actualAchievement: Number(actualAchievement),
                progressNotes,
                evidenceUrl,
                date: new Date().toISOString()
              });
              return { ...g, checkIns: updatedCheckIns };
            }
            return g;
          }));
          toast.success("Demonstration Check-in Submitted Successfully!");
          resetForm();
        }, 800);
        return;
      }

      const res = await fetch(`${getBackendUrl()}/api/goals/${goalId}/checkins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quarter: "Q2",
          actualAchievement: Number(actualAchievement),
          progressNotes,
          evidenceUrl
        })
      });

      if (res.ok) {
        toast.success("Progress check-in logged successfully!");
        resetForm();
        fetchGoals();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to submit check-in");
      }
    } catch (err) {
      toast.error("Failed to connect to backend api server.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setExpandedGoalId(null);
    setActualAchievement("");
    setProgressNotes("");
    setEvidenceUrl("");
  };

  const filteredGoals = goals.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.thrustArea.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "pending") return matchesSearch && (!g.checkIns || g.checkIns.length === 0);
    if (activeFilter === "updated") return matchesSearch && g.checkIns && g.checkIns.length > 0;
    return matchesSearch;
  });

  // KPI Calculations
  const totalWeight = goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  const updatedCount = goals.filter(g => g.checkIns && g.checkIns.length > 0).length;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07080a] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <span className="text-sm font-medium text-amber-500 tracking-wider">Syncing workspace logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] text-white p-6 sm:p-10 relative overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6 relative z-10"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> GoalSphere Edge Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Workspace Check-Ins
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Submit secure performance checkpoint evidence logs and metrics to the AI consensus board.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              localStorage.getItem("token") ? toast.info("Create a new goal on your team dashboard!") : toast.warning("Sign in to sync with team cloud database");
            }}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/10 rounded-xl px-5 py-2.5 transition-all duration-300"
          >
            <Plus className="w-4.5 h-4.5 mr-2" /> New Goal Log
          </Button>
        </div>
      </motion.div>

      {/* Overview Analytics Dashboard widgets */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8 relative z-10">
        {[
          {
            title: "Total Tracked Weightage",
            value: `${totalWeight}%`,
            description: "Workforce alignment strength index",
            icon: Layers,
            color: "text-amber-400"
          },
          {
            title: "Logged Progress Updates",
            value: `${updatedCount} / ${goals.length}`,
            description: "Current active cycle participation",
            icon: CheckCircle2,
            color: "text-emerald-400"
          },
          {
            title: "Workspace Cycle",
            value: "Q2 2026",
            description: "14 Days until consensus closure",
            icon: Clock,
            color: "text-cyan-400"
          }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <Card className="glass-card bg-zinc-950/80 border border-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                  <div className={`text-3xl font-extrabold tracking-tight ${stat.color}`}>{stat.value}</div>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Control Bar (Search + Filter) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 relative z-10 bg-zinc-950/40 p-4 rounded-2xl border border-white/5"
      >
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search objectives, thrust areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-gray-600 text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 overflow-x-auto py-1">
          {[
            { id: "all", label: "All Objectives" },
            { id: "pending", label: "Pending Updates" },
            { id: "updated", label: "Logged Progress" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                activeFilter === f.id 
                  ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/10" 
                  : "bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Goal / Check-in List */}
      <div className="space-y-4 relative z-10">
        <AnimatePresence mode="popLayout">
          {filteredGoals.map((goal, i) => {
            const checkIns = goal.checkIns || [];
            const hasCheckins = checkIns.length > 0;
            const currentVal = hasCheckins ? checkIns[checkIns.length - 1].actualAchievement : 0;
            let progressPercent = 0;
            if (goal.targetValue > 0) {
              progressPercent = Math.min((currentVal / goal.targetValue) * 100, 100);
            }
            const isExpanded = expandedGoalId === goal._id;

            return (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="glass-card bg-zinc-950/70 border border-white/10 hover:border-amber-500/20 transition-colors duration-300 rounded-2xl overflow-hidden relative">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Info & Metrics */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {goal.thrustArea}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              Weightage: {goal.weightage}%
                            </span>
                          </div>
                          <span className="text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-semibold tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">{goal.title}</h3>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{goal.description}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                          <span>Consensus Target: <strong className="text-gray-300">{goal.targetValue} {goal.uom === "Percentage" ? "%" : ""}</strong></span>
                          <span>Logged Achievement: <strong className="text-gray-300">{currentVal} {goal.uom === "Percentage" ? "%" : ""}</strong></span>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Consensus Progress</span>
                            <span className="font-bold text-emerald-400">{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress 
                            value={progressPercent} 
                            className="h-1.5 bg-white/5" 
                            indicatorClassName="bg-gradient-to-r from-amber-500 to-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Interactive Button Panel */}
                      <div className="flex flex-col sm:flex-row gap-3 min-w-[200px] lg:shrink-0 w-full lg:w-auto">
                        <Button 
                          onClick={() => {
                            if (isExpanded) {
                              resetForm();
                            } else {
                              setExpandedGoalId(goal._id);
                              setActualAchievement("");
                              setProgressNotes("");
                              setEvidenceUrl("");
                            }
                          }}
                          className="w-full bg-zinc-900 border border-white/10 hover:border-amber-500/40 text-white font-bold h-11 rounded-xl transition-all duration-300"
                        >
                          {isExpanded ? "Dismiss Console" : <><CheckSquare className="w-4 h-4 mr-2 text-amber-500" /> Log Check-In</>}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Action Check-in Form */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" /> Secure Checkpoint Integration Console
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Actual Achievement to Date</label>
                                <input 
                                  type="number"
                                  value={actualAchievement}
                                  onChange={(e) => setActualAchievement(e.target.value)}
                                  placeholder={`Target Value is ${goal.targetValue}`}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 text-sm text-white p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Evidence Link / PDF / PR URL</label>
                                <input 
                                  type="text"
                                  value={evidenceUrl}
                                  onChange={(e) => setEvidenceUrl(e.target.value)}
                                  placeholder="https://github.com/org/repo/pull/..."
                                  className="w-full rounded-xl border border-white/10 bg-black/40 text-sm text-white p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600"
                                />
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Consensus Notes / Progress Narrative</label>
                                <textarea 
                                  value={progressNotes}
                                  onChange={(e) => setProgressNotes(e.target.value)}
                                  placeholder="Provide key metrics and brief descriptive points on what milestones were accomplished in this phase..."
                                  rows={3}
                                  className="w-full rounded-xl border border-white/10 bg-black/40 text-sm text-white p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-gray-600 resize-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={resetForm}
                                className="text-gray-400 hover:text-white"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => handleSubmitCheckin(goal._id)} 
                                disabled={submitting}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold shadow-lg shadow-emerald-500/10 rounded-xl px-5 h-10 transition-all"
                              >
                                {submitting ? "Logging Milestone..." : "Submit Node Check-In"}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Past check-in history feed list */}
                    {checkIns.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold uppercase tracking-wider">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Secure Progress Ledger Feed
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {checkIns.map((ci: any, idx: number) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span className="text-amber-500">{ci.quarter || "Q2"} Milestone Update</span>
                                <span className="text-gray-500 font-medium">{new Date(ci.date || ci.submittedAt || Date.now()).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-300">
                                Current Accomplishment Level: <strong>{ci.actualAchievement} {goal.uom === "Percentage" ? "%" : ""}</strong>
                              </p>
                              {ci.progressNotes && (
                                <p className="text-gray-400 italic mt-0.5 leading-relaxed">&quot;{ci.progressNotes}&quot;</p>
                              )}
                              {ci.evidenceUrl && (
                                <div className="text-emerald-400 mt-1 flex items-center gap-1">
                                  <span className="font-semibold text-[10px] uppercase">Ledger Proof:</span>
                                  <a 
                                    href={ci.evidenceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="underline hover:text-emerald-300 break-all truncate font-mono text-[10px]"
                                  >
                                    {ci.evidenceUrl}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredGoals.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-zinc-950/40 rounded-2xl border border-white/5"
          >
            <AlertCircle className="w-10 h-10 text-amber-500/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Matching Objectives</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filter settings or search query parameters.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}