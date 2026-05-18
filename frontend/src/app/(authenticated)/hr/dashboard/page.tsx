"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, CheckCircle2, ShieldCheck, TrendingUp, AlertTriangle, 
  Calendar, FileText, Send, User, MessageSquare, Plus, Clock, 
  RefreshCcw, Landmark, Settings, Download, Activity, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { LiveActivityFeed } from "@/components/ui/LiveActivityFeed";
import { OnlineBadge } from "@/components/ui/OnlineBadge";
import { toast } from "sonner";
import { AIInsightCards } from "@/components/ui/AIInsightCards";
import { AIWorkforceSimulator } from "@/components/ui/AIWorkforceSimulator";
import { AIAttendancePredictor } from "@/components/ui/AIAttendancePredictor";
import { WeeklyIntelligenceCard } from "@/components/ui/WeeklyIntelligenceCard";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

interface LeaveRequest {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  user: { name: string; department: string };
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: { name: string; avatar: string };
}

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

export default function AnalyticsPage() {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);

  // ── States ────────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    goalsSubmitted: 0,
    approvalRate: "0%",
    activeCycle: "Q2 Active"
  });
  const [chartData, setChartData] = useState<{ name: string; 'On Track': number; Delayed: number; Blocked: number }[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Announcement Form
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annTarget, setAnnTarget] = useState("all");

  // Chat Panel
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch HR Data ─────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/dashboard/hr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || {});
        setChartData(data.departmentDistribution || []);
        setLeaves(data.allLeaves || []);
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("HR dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

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
        const preselectId = localStorage.getItem("activeChatUserId");
        if (preselectId) {
          const target = users.find((u: any) => u._id === preselectId);
          if (target) {
            setActiveChatUser(target);
          }
          localStorage.removeItem("activeChatUserId");
        }
      }
    } catch (err) {
      console.error("Chat users fetch error:", err);
    }
  };

  const fetchChatMessages = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch (err) {
      console.error("Messages fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchChatUsers();
  }, []);

  useEffect(() => {
    if (activeChatUser) {
      fetchChatMessages(activeChatUser._id);
    }
  }, [activeChatUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingUser]);

  // ── Socket Events (Real-Time Subscriptions) ────────────────────────────────
  useSocketEvent<LeaveRequest>("leave:created", (newLeave) => {
    setLeaves((prev) => [newLeave, ...prev]);
    toast.info(`📅 New Leave Request submitted by ${newLeave.user.name}`);
  });

  useSocketEvent<LeaveRequest>("leave:updated", (updatedLeave) => {
    setLeaves((prev) => prev.map((l) => (l._id === updatedLeave._id ? updatedLeave : l)));
  });

  useSocketEvent<Message>("message:new", (newMsg) => {
    if (activeChatUser && (newMsg.sender._id === activeChatUser._id || newMsg.sender._id === socket?.id)) {
      setChatMessages((prev) => [...prev, newMsg]);
    } else {
      toast.info(`💬 Direct Message from ${newMsg.sender.name}: "${newMsg.text.slice(0, 30)}..."`);
    }
  });

  useSocketEvent<{ senderId: string; senderName: string }>("typing:start", (data) => {
    if (activeChatUser && data.senderId === activeChatUser._id) {
      setTypingUser(data.senderName);
    }
  });

  useSocketEvent<{ senderId: string }>("typing:stop", (data) => {
    if (activeChatUser && data.senderId === activeChatUser._id) {
      setTypingUser(null);
    }
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    const token = localStorage.getItem("token");
    
    // Optimistic UI Update
    const optimisticAnn = {
      _id: `temp-${Date.now()}`,
      title: annTitle,
      content: annContent,
      createdAt: new Date().toISOString(),
      createdBy: { name: "HR Director", avatar: "" }
    };
    setAnnouncements((prev) => [optimisticAnn, ...prev]);
    setShowAnnModal(false);
    toast.info("Broadcasting announcement...");
    
    const currentTitle = annTitle;
    const currentContent = annContent;
    setAnnTitle("");
    setAnnContent("");

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/announcement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          targetRole: annTarget
        })
      });
      if (res.ok) {
        const newAnn = await res.json();
        setAnnouncements((prev) => prev.map(a => a._id === optimisticAnn._id ? newAnn : a));
        toast.success("Announcement broadcasted successfully in real time!");
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      setAnnouncements((prev) => prev.filter(a => a._id !== optimisticAnn._id));
      setShowAnnModal(true);
      setAnnTitle(currentTitle);
      setAnnContent(currentContent);
      toast.error("Failed to post announcement");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;
    const token = localStorage.getItem("token");
    
    // Optimistic UI
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: socket?.id || "me", name: "Me", avatar: "" },
      text: chatInput,
      createdAt: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);
    const currentInput = chatInput;
    setChatInput("");
    socket?.emit("typing:stop", { recipientId: activeChatUser._id });

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: activeChatUser._id,
          text: chatInput
        })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages((prev) => prev.map(m => m._id === optimisticMsg._id ? newMsg : m));
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      setChatMessages((prev) => prev.filter(m => m._id !== optimisticMsg._id));
      setChatInput(currentInput);
      toast.error("Failed to send message");
    }
  };

  const handleChatInputChange = (val: string) => {
    setChatInput(val);
    if (activeChatUser) {
      if (val.trim().length > 0) {
        socket?.emit("typing:start", { recipientId: activeChatUser._id });
      } else {
        socket?.emit("typing:stop", { recipientId: activeChatUser._id });
      }
    }
  };

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">HR Control Analytics</h1>
          <p className="text-muted-foreground mt-1">Real-time company telemetry, policy actions and announcements.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAnnModal(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4 mr-2" /> New Announcement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Organization Headcount", value: metrics.totalEmployees, icon: Activity, trend: "Active in system" },
          { title: "Cycle Goals Submitted", value: metrics.goalsSubmitted, icon: BarChart3, trend: "Pending/Approved status" },
          { title: "Review Approval Rate", value: metrics.approvalRate, icon: ShieldCheck, trend: "Avg manager turnaround" },
          { title: "Performance Cycle", value: metrics.activeCycle, icon: Settings, trend: "Active current period" },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -5 }}
          >
            <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl hover:bg-white/[0.02] transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{kpi.title}</CardTitle>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <kpi.icon className="w-4 h-4 text-primary animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.trend}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enterprise AI Insights */}
      <AIInsightCards role="hr" data={{ metrics, leaves, announcements }} />

      {/* AI Workforce Simulator */}
      <AIWorkforceSimulator role="hr" />

      {/* Smart Attendance Prediction System */}
      <AIAttendancePredictor />

      {/* Weekly Intelligence Summary */}
      <WeeklyIntelligenceCard role="hr" />

      {/* Performance Distribution Chart */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Departmental Goal Distribution status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="On Track" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Delayed" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Blocked" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Collaboration Chat */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary animate-pulse" /> Live HR Direct Communication
              </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-12 h-[340px]">
              {/* User list */}
              <div className="md:col-span-3 border-r border-white/5 p-2 overflow-y-auto space-y-1 max-h-[340px]">
                <p className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">Teammates</p>
                {chatUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => setActiveChatUser(u)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-colors text-left ${
                      activeChatUser?._id === u._id ? 'bg-primary/10 text-white ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold">{u.name[0]}</span>
                        )}
                      </div>
                      <OnlineBadge userId={u._id} size="xs" className="absolute -bottom-0.5 -right-0.5 border border-[#0d0e12]" />
                    </div>
                    <div className="min-w-0 leading-none">
                      <p className="text-xs font-semibold truncate text-white">{u.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate mt-0.5">{u.designation || u.role}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat panel */}
              <div className="md:col-span-9 flex flex-col h-full bg-black/40 overflow-hidden relative">
                {activeChatUser ? (
                  <>
                    <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                      <div className="flex items-center gap-2 leading-none">
                        <span className="text-xs font-semibold text-white">{activeChatUser.name}</span>
                        <span className="text-[9px] text-muted-foreground">{activeChatUser.role}</span>
                      </div>
                      <OnlineBadge userId={activeChatUser._id} size="sm" />
                    </div>

                    {/* Message Area */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-[220px]">
                      {chatMessages.map((m) => {
                        const isSelf = m.sender._id === socket?.id || m.sender._id !== activeChatUser._id;
                        return (
                          <div key={m._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-xs ${
                              isSelf ? 'bg-primary text-white rounded-br-none' : 'bg-white/5 border border-white/10 text-white rounded-bl-none'
                            }`}>
                              <p className="leading-relaxed">{m.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {typingUser && (
                        <div className="flex justify-start">
                          <p className="text-[10px] text-muted-foreground italic tracking-wider animate-pulse">Typing...</p>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-2 border-t border-white/5 flex gap-2 bg-white/[0.01]">
                      <Input
                        value={chatInput}
                        onChange={(e) => handleChatInputChange(e.target.value)}
                        placeholder={`Message ${activeChatUser.name.split(" ")[0]}...`}
                        className="flex-1 bg-black/20 border-white/10 text-xs h-8 focus-visible:ring-primary placeholder:text-gray-600"
                      />
                      <Button type="submit" size="sm" className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-white shrink-0">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-1.5">
                    <MessageSquare className="w-6 h-6 text-white/10" />
                    <p className="text-xs">Select a teammate to start chatting in real time.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right timeline and leaves */}
        <div className="lg:col-span-4 space-y-6">
          {/* Announcements block */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Live Company Broadcasts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No global announcements posted yet.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann._id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-semibold text-white">{ann.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-muted-foreground mt-2 block">By {ann.createdBy?.name || "HR Director"}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Org leaves */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-primary" /> Active Leave Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaves.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No active leaves requested.</p>
              ) : (
                leaves.map((l) => (
                  <div key={l._id} className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-white truncate">{l.user?.name || "Teammate"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{l.type} Leave ({l.user?.department})</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 font-semibold uppercase ${
                      l.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      l.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Announcement Modal Backdrop */}
      <AnimatePresence>
        {showAnnModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
            >
            <h2 className="text-xl font-bold text-white mb-4">Post Announcement</h2>
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Target Role Audience</label>
                <select
                  value={annTarget}
                  onChange={(e) => setAnnTarget(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Everyone</option>
                  <option value="employee">Employees Only</option>
                  <option value="manager">Managers Only</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="bg-black/40 border-white/10 text-sm h-10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Message Content</label>
                <textarea
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Type policy update, event details, or announcement here..."
                />
              </div>
              <div className="flex gap-2.5 justify-end pt-3">
                <Button type="button" variant="outline" onClick={() => setShowAnnModal(false)} className="border-white/10 text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/95 text-white">
                  Broadcast Policy
                </Button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
