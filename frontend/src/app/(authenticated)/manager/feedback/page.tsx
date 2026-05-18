"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Search, Clock, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { DashboardLoader } from "@/components/ui/DashboardLoader";
import { OnlineBadge } from "@/components/ui/OnlineBadge";

interface ChatUser {
  _id: string;
  name: string;
  avatar: string;
  role: string;
  designation: string;
}

interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar: string };
  text: string;
  createdAt: string;
}

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function FeedbackPage() {
  const { socket } = useSocket();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchChatUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/messages/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setChatUsers(users);

        // Preselect employee if redirected via local storage (e.g. from Employees directory profile)
        const preselectId = localStorage.getItem("activeChatUserId");
        if (preselectId) {
          const target = users.find((u: any) => u._id === preselectId);
          if (target) {
            setActiveUser(target);
          } else if (users.length > 0) {
            setActiveUser(users[0]);
          }
          localStorage.removeItem("activeChatUserId");
        } else if (users.length > 0) {
          setActiveUser(users[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (userId: string) => {
    setMessagesLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchChatUsers();
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchChatMessages(activeUser._id);
    } else {
      setMessages([]);
    }
  }, [activeUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Socket: Incoming dynamic messages
  useSocketEvent<Message>("message:new", (newMsg) => {
    if (activeUser && (newMsg.sender._id === activeUser._id || newMsg.sender._id === socket?.id)) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    } else {
      toast.info(`💬 Feedback from ${newMsg.sender.name}: "${newMsg.text.slice(0, 30)}..."`);
    }
  });

  // Socket: Typing Indicators
  useSocketEvent<{ senderId: string; senderName: string }>("typing:start", (data) => {
    if (activeUser && data.senderId === activeUser._id) {
      setTypingUser(data.senderName);
    }
  });

  useSocketEvent<{ senderId: string }>("typing:stop", (data) => {
    if (activeUser && data.senderId === activeUser._id) {
      setTypingUser(null);
    }
  });

  const handleInputChange = (val: string) => {
    setMsg(val);
    if (activeUser) {
      if (val.trim().length > 0) {
        socket?.emit("typing:start", { recipientId: activeUser._id });
      } else {
        socket?.emit("typing:stop", { recipientId: activeUser._id });
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim() || !activeUser) return;
    const token = localStorage.getItem("token");

    // Optimistic UI updates
    const optimisticMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: socket?.id || "me", name: "You", avatar: "" },
      text: msg,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    const currentInput = msg;
    setMsg("");
    socket?.emit("typing:stop", { recipientId: activeUser._id });

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: activeUser._id,
          text: currentInput
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => prev.map((m) => m._id === optimisticMsg._id ? newMsg : m));
        toast.success("Feedback Sent", { description: `Your message has been delivered to ${activeUser.name}.` });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      // Revert optimistic updates
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      setMsg(currentInput);
      toast.error("Failed to send message");
    }
  };

  const filteredUsers = chatUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-amber-500 animate-pulse" />
          Continuous Feedback Workspace
        </h1>
        <p className="text-gray-400 mt-1">Manage 1-on-1 continuous conversation check-ins and performance coaching with teammates.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 mt-6">
        {/* Teammates Sidebar */}
        <Card className="w-1/3 bg-[#111] border border-white/5 flex flex-col hidden lg:flex rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team members..." 
                className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-amber-500" 
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => setActiveUser(user)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-white/5 ${activeUser?._id === user._id ? "bg-amber-500/10 border-l-4 border-l-amber-500" : "hover:bg-white/5"}`}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-amber-500/20 text-amber-500 font-bold">{user.name[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <OnlineBadge userId={user._id} size="xs" className="absolute -bottom-0.5 -right-0.5 border border-[#111]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white truncate text-sm">{user.name}</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.designation || user.role}</p>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No team members found.
              </div>
            )}
          </div>
        </Card>

        {/* Live Conversation Chat Area */}
        <Card className="flex-1 bg-[#111] border border-white/5 flex flex-col overflow-hidden rounded-xl shadow-2xl">
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-white/10">
                      {activeUser.avatar ? (
                        <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-amber-500/20 text-amber-500 font-bold">{activeUser.name[0]}</AvatarFallback>
                      )}
                    </Avatar>
                    <OnlineBadge userId={activeUser._id} size="sm" className="absolute -bottom-0.5 -right-0.5 border border-[#111]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{activeUser.name}</h4>
                    <p className="text-xs text-amber-500/80 font-medium mt-0.5">{activeUser.designation || activeUser.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Real-time Workspace</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20">
                {messagesLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <RefreshCcw className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                    <p className="text-xs font-medium">Syncing messaging secure channel...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-medium text-white/70">No message history with {activeUser.name}.</p>
                    <p className="text-xs mt-1 text-gray-500">Send an executive prompt to initiate feedback coaching.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isSelf = m.sender._id === socket?.id || m.sender.name === "You" || m.sender._id !== activeUser._id;
                    return (
                      <motion.div
                        key={m._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-end gap-2.5 max-w-[75%]">
                          {!isSelf && (
                            <Avatar className="w-8 h-8 shrink-0 mb-1 border border-white/10">
                              {activeUser.avatar ? (
                                <img src={activeUser.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xs font-bold">{activeUser.name[0]}</AvatarFallback>
                              )}
                            </Avatar>
                          )}
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isSelf ? "bg-amber-500 text-black rounded-br-sm font-semibold shadow-lg shadow-amber-500/10" : "bg-white/10 text-white rounded-bl-sm border border-white/5"}`}>
                            <p>{m.text}</p>
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-500 mt-1 px-2">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </motion.div>
                    );
                  })
                )}
                {typingUser && (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 shrink-0 border border-white/10">
                      {activeUser.avatar ? (
                        <img src={activeUser.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xs font-bold">{activeUser.name[0]}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm">
                      <span className="text-xs text-muted-foreground italic tracking-wider animate-pulse">{typingUser} is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/5 bg-black/40">
                <form onSubmit={handleSend} className="flex gap-3">
                  <Input
                    value={msg}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={`Prompt feedback or instructions for ${activeUser.name.split(" ")[0]}...`}
                    className="flex-grow bg-black/40 border-white/10 text-white focus-visible:ring-amber-500 placeholder:text-gray-600"
                  />
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black px-6 shadow-lg shadow-amber-500/15 transition-all">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4 opacity-10 animate-bounce" />
              <p className="font-semibold text-white/80">No Conversation Session Active</p>
              <p className="text-xs text-gray-500 mt-1">Please select an employee profile from the list to begin secure coaching.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
