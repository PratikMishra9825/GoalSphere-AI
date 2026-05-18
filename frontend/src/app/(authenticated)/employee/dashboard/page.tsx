"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, TrendingUp, Clock, AlertCircle, CheckCircle2, 
  Calendar, FileText, Send, User, MessageSquare, AlertTriangle, 
  Plus, CheckSquare, RefreshCcw, Landmark 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { LiveActivityFeed } from "@/components/ui/LiveActivityFeed";
import { OnlineBadge } from "@/components/ui/OnlineBadge";
import { toast } from "sonner";
import { AIInsightCards } from "@/components/ui/AIInsightCards";
import { WeeklyIntelligenceCard } from "@/components/ui/WeeklyIntelligenceCard";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
}

interface Leave {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
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

const calculateAttendanceRate = (overallCompletionStr: string, pendingTasksCount: number, leavesCount: number) => {
  const completionRate = parseInt(overallCompletionStr) || 85;
  let rate = 98;
  rate -= (leavesCount * 2);
  rate -= (pendingTasksCount * 1.5);
  rate += (completionRate - 80) * 0.15;
  return Math.min(Math.max(Math.round(rate), 65), 100);
};

export default function EmployeeDashboard() {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);

  // ── States ────────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState({
    overallCompletion: "0%",
    activeGoals: 0,
    upcomingDeadlines: 0,
    productivityScore: 90,
    attendanceRate: 96
  });
  const [goals, setGoals] = useState<{ title: string; progress: number; color: string }[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Leave Form
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Sick");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Chat Panel
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch Dashboard Data ──────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/dashboard/employee`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const calculatedAttendanceRate = calculateAttendanceRate(
          data.metrics?.overallCompletion || "0%",
          data.tasks?.length || 0,
          data.leaves?.length || 0
        );
        setMetrics({
          ...data.metrics,
          attendanceRate: calculatedAttendanceRate
        });
        setGoals(data.goals || []);
        setTasks(data.tasks || []);
        setLeaves(data.leaves || []);
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
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

  // ── Socket Events (Real-Time Updates) ─────────────────────────────────────
  useSocketEvent<Task>("task:created", (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    setMetrics((m) => ({ ...m, upcomingDeadlines: m.upcomingDeadlines + 1 }));
    toast.info(`📋 New task assigned: "${newTask.title}"`);
  });

  useSocketEvent<Task>("task:completed", (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    setMetrics((m) => ({ ...m, upcomingDeadlines: Math.max(0, m.upcomingDeadlines - 1) }));
  });

  useSocketEvent<Leave>("leave:updated", (updatedLeave) => {
    setLeaves((prev) => prev.map((l) => (l._id === updatedLeave._id ? updatedLeave : l)));
    toast.success(`📅 Leave request status updated: "${updatedLeave.type}" is ${updatedLeave.status}`);
  });

  useSocketEvent<Announcement>("announcement:new", (newAnn) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    toast.info(`📢 New announcement: "${newAnn.title}"`);
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
  const handleCompleteTask = async (taskId: string) => {
    const token = localStorage.getItem("token");
    const taskToUpdate = tasks.find(t => t._id === taskId);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: "Completed" } : t)));
    toast.info("Completing task...");

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/task/${taskId}/complete`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Task completed successfully!");
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      if (taskToUpdate) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? taskToUpdate : t)));
      }
      toast.error("Failed to complete task");
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // Optimistic UI
    const optimisticLeave: Leave = {
      _id: `temp-${Date.now()}`,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      status: 'Pending',
      reason: leaveReason
    };
    setLeaves(prev => [optimisticLeave, ...prev]);
    setShowLeaveModal(false);
    toast.info("Submitting leave request...");
    
    const cReason = leaveReason;
    setLeaveReason("");

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: leaveType,
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: cReason
        })
      });
      if (res.ok) {
        const newLeave = await res.json();
        setLeaves((prev) => prev.map(l => l._id === optimisticLeave._id ? newLeave : l));
        toast.success("Leave request submitted successfully in real time!");
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      setLeaves(prev => prev.filter(l => l._id !== optimisticLeave._id));
      setShowLeaveModal(true);
      setLeaveReason(cReason);
      toast.error("Failed to submit leave request");
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
      {/* Real-time Indicator Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Employee Workspace</h1>
          <p className="text-muted-foreground mt-1">Sleek, real-time collaboration environment.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowLeaveModal(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            <Calendar className="w-4 h-4 mr-2" /> Request Leave
          </Button>
        </div>
      </div>

      {/* Dynamic Telemetry Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { title: "Overall Completion", value: metrics.overallCompletion, icon: Target, desc: "Objectives approved" },
          { title: "Active Objectives", value: metrics.activeGoals, icon: TrendingUp, desc: "Live in current cycle" },
          { title: "Assigned Tasks", value: metrics.upcomingDeadlines, icon: Clock, desc: "Awaiting action" },
          { title: "Attendance Rate", value: `${metrics.attendanceRate}%`, icon: Landmark, desc: "Q2 current record" },
          { title: "Productivity Score", value: metrics.productivityScore, icon: AlertCircle, desc: "Performance index" },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -5 }}
          >
            <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl hover:bg-white/[0.03] transition-colors">
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{kpi.title}</span>
                  <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center">
                    <kpi.icon className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{kpi.value}</div>
                <p className="text-[10px] text-muted-foreground">{kpi.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enterprise AI Insights */}
      <AIInsightCards role="employee" data={{ metrics, tasks, goals, leaves }} />

      {/* Weekly Intelligence Summary */}
      <WeeklyIntelligenceCard role="employee" />

      {/* Main Grid content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Objectives Progress */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Active Goal Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active goals found in DB. Set one now!</p>
              ) : (
                goals.map((goal, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-200 truncate pr-2">{goal.title}</span>
                      <span className="text-muted-foreground shrink-0">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5 bg-white/5" indicatorClassName={goal.color} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Leaves Status */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaves.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No leave requests found.</p>
              ) : (
                leaves.map((l) => (
                  <div key={l._id} className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-white">{l.type} Leave</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-semibold ${
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

        {/* Task Board & Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Real-time Task Board */}
            <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" /> Today&apos;s Active Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No pending tasks. You&apos;re all set!</p>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task._id} 
                      className={`flex items-start justify-between p-3 rounded-xl border transition-colors ${
                        task.status === 'Completed' 
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60' 
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="min-w-0 pr-4">
                        <p className={`text-xs font-semibold ${task.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                      </div>
                      {task.status !== 'Completed' ? (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTask(task._id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] h-6 px-2 shadow-md shrink-0"
                        >
                          Complete
                        </Button>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Announcements list */}
            <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary animate-bounce" /> Dynamic Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No team announcements posted yet.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann._id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      <h4 className="text-xs font-semibold text-white">{ann.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{ann.content}</p>
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.03]">
                        <User className="w-3 h-3 text-primary" />
                        <span className="text-[9px] text-muted-foreground">{ann.createdBy?.name || "System Admin"}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Real-time Collaboration Chat */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary animate-pulse" /> Live Workspace Chat
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
      </div>

      {/* Real-time Activity Timeline */}
      <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary animate-pulse" /> Live Workspace Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LiveActivityFeed maxItems={6} />
        </CardContent>
      </Card>

      {/* Leave Request Dialog Backdrop */}
      <AnimatePresence>
        {showLeaveModal && (
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
            <h2 className="text-xl font-bold text-white mb-4">Request Leave</h2>
            <form onSubmit={handleRequestLeave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                >
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Earned">Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Reason</label>
                <textarea
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white resize-none"
                  placeholder="State the reason for leave request..."
                />
              </div>
              <div className="flex gap-2.5 justify-end pt-3">
                <Button type="button" variant="outline" onClick={() => setShowLeaveModal(false)} className="border-white/10 text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/95 text-white">
                  Submit Request
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
