"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, CheckCircle2, ShieldCheck, TrendingUp, AlertTriangle, 
  Calendar, FileText, Send, User, MessageSquare, Plus, Clock, 
  RefreshCcw, Landmark, Mail, Phone, Target, Award, X, CheckSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { LiveActivityFeed } from "@/components/ui/LiveActivityFeed";
import { OnlineBadge } from "@/components/ui/OnlineBadge";
import { toast } from "sonner";
import { AIInsightCards } from "@/components/ui/AIInsightCards";
import { AIWorkforceSimulator } from "@/components/ui/AIWorkforceSimulator";
import { WeeklyIntelligenceCard } from "@/components/ui/WeeklyIntelligenceCard";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

interface GoalApproval {
  _id: string;
  title: string;
  description: string;
  owner: { _id: string; name: string; avatar: string; designation: string };
  status: string;
}

interface LeaveApproval {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  user: { _id: string; name: string; avatar: string; department: string };
  status: string;
}

interface TeamMember {
  _id: string;
  name: string;
  designation: string;
  avatar: string;
  score: number;
  status: string;
  email?: string;
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

const calculateTeamEngagement = (members: TeamMember[]) => {
  if (!members || members.length === 0) return "92%";
  const avgScore = members.reduce((sum, m) => sum + m.score, 0) / members.length;
  const score = Math.min(98, Math.max(70, Math.round(avgScore * 0.8 + 20)));
  return `${score}%`;
};

export default function ManagerDashboard() {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);

  // ── States ────────────────────────────────────────────────────────────────
  const [teamSize, setTeamSize] = useState(0);
  const [pendingGoals, setPendingGoals] = useState<GoalApproval[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveApproval[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(null);
  const [selectedEmployeeGoals, setSelectedEmployeeGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const fetchEmployeeGoals = async (employeeId: string) => {
    setGoalsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${getBackendUrl()}/api/goals?owner=${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedEmployeeGoals(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch employee goals:", err);
    } finally {
      setGoalsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeGoals(selectedEmployee._id);
    } else {
      setSelectedEmployeeGoals([]);
    }
  }, [selectedEmployee]);

  // Task Assignment Form
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");

  // Chat Panel
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch Manager Data ────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/dashboard/manager`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamSize(data.teamSize || 0);
        setPendingGoals(data.pendingApprovals?.goals || []);
        setPendingLeaves(data.pendingApprovals?.leaves || []);
        setTeamMembers(data.teamMembers || []);
      }
    } catch (err) {
      console.error("Manager dashboard fetch error:", err);
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
  useSocketEvent<GoalApproval>("goal:created", (newGoal) => {
    // If it's a team member, add to pending approvals
    if (teamMembers.some((m) => m._id === newGoal.owner?._id)) {
      setPendingGoals((prev) => {
        if (prev.some((g) => g._id === newGoal._id)) return prev;
        return [newGoal, ...prev];
      });
      toast.info(`📋 New Goal submitted by ${newGoal.owner.name}`);
      fetchDashboardData();
    }
  });

  useSocketEvent<any>("goal:updated", (updatedGoal) => {
    // Instantly refresh dashboard data to recalculate direct reports' live scores on any check-in
    fetchDashboardData();

    if (updatedGoal.status === "Pending Approval") {
      setPendingGoals((prev) => {
        if (prev.some((g) => g._id === updatedGoal._id)) {
          return prev.map((g) => g._id === updatedGoal._id ? updatedGoal : g);
        }
        return [updatedGoal, ...prev];
      });
      toast.info(`📋 Goal submitted for review by ${updatedGoal.owner?.name || "Team Member"}`);
    } else {
      // If status changed to Approved/Rejected, remove from pending approvals
      setPendingGoals((prev) => prev.filter((g) => g._id !== updatedGoal._id));
    }
  });

  useSocketEvent<LeaveApproval>("leave:created", (newLeave) => {
    if (teamMembers.some((m) => m._id === newLeave.user?._id)) {
      setPendingLeaves((prev) => [newLeave, ...prev]);
      toast.info(`📅 New Leave Request submitted by ${newLeave.user.name}`);
    }
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

  // ── Approval actions ───────────────────────────────────────────────────────
  const handleApproveGoal = async (goalId: string) => {
    const token = localStorage.getItem("token");
    const goalToApprove = pendingGoals.find((g) => g._id === goalId);
    setPendingGoals((prev) => prev.filter((g) => g._id !== goalId));
    toast.info("Approving goal...");

    try {
      const res = await fetch(`${getBackendUrl()}/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Approved" })
      });
      if (res.ok) {
        toast.success("Goal approved successfully in real time!");
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      if (goalToApprove) setPendingGoals((prev) => [goalToApprove, ...prev]);
      toast.error("Failed to approve goal");
    }
  };

  const handleApproveLeave = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    const token = localStorage.getItem("token");
    const leaveToProcess = pendingLeaves.find((l) => l._id === leaveId);
    setPendingLeaves((prev) => prev.filter((l) => l._id !== leaveId));
    toast.info(`Processing leave as ${status}...`);

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/leave/${leaveId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Leave request ${status.toLowerCase()} in real time!`);
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      if (leaveToProcess) setPendingLeaves((prev) => [leaveToProcess, ...prev]);
      toast.error("Failed to update leave request");
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskAssignedTo || !taskDueDate) return;
    const token = localStorage.getItem("token");
    
    setShowTaskModal(false);
    toast.info("Assigning task...");
    const cTitle = taskTitle;
    const cDesc = taskDesc;
    setTaskTitle("");
    setTaskDesc("");

    try {
      const res = await fetch(`${getBackendUrl()}/api/actions/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: cTitle,
          description: cDesc,
          assignedTo: taskAssignedTo,
          dueDate: taskDueDate,
          priority: taskPriority
        })
      });
      if (res.ok) {
        toast.success("Task assigned and broadcasted in real time!");
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      setShowTaskModal(true);
      setTaskTitle(cTitle);
      setTaskDesc(cDesc);
      toast.error("Failed to assign task");
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Team Management</h1>
          <p className="text-muted-foreground mt-1">Real-time team analytics, tasks and workspace queue.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowTaskModal(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Assign Task
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        {[
          { title: "Direct Reports", value: teamSize, icon: Users, color: "text-primary" },
          { title: "Pending Goals", value: pendingGoals.length, icon: Clock, color: "text-amber-400" },
          { title: "Pending Leaves", value: pendingLeaves.length, icon: Calendar, color: "text-cyan-400" },
          { title: "Team Engagement", value: calculateTeamEngagement(teamMembers), icon: TrendingUp, color: "text-emerald-400" }
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -5 }}
          >
            <Card className="glass-card border-white/10 bg-black/20 text-white hover:bg-white/[0.02] transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{kpi.title}</span>
                  <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enterprise AI Insights */}
      <AIInsightCards role="manager" data={{ teamMembers, pendingGoals, pendingLeaves, teamSize }} />

      {/* AI Workforce Simulator */}
      <AIWorkforceSimulator role="manager" />

      {/* Weekly Intelligence Summary */}
      <WeeklyIntelligenceCard role="manager" />

      {/* Main grids */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left approvals and action items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Goal approvals queue */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-primary" /> Goal Approval Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingGoals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No pending goal reviews at this time.</p>
              ) : (
                pendingGoals.map((goal) => (
                  <div key={goal._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 border border-white/10">
                        {goal.owner?.avatar ? (
                          <img src={goal.owner.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs flex items-center justify-center h-full font-bold">{goal.owner?.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{goal.owner?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{goal.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveGoal(goal._id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 shadow-md"
                      >
                        Approve Goal
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Leave approvals queue */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-primary" /> Leave Requests Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingLeaves.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No pending leave requests at this time.</p>
              ) : (
                pendingLeaves.map((leave) => (
                  <div key={leave._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 border border-white/10">
                        {leave.user?.avatar ? (
                          <img src={leave.user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs flex items-center justify-center h-full font-bold">{leave.user?.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{leave.user?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{leave.type} Leave Request</p>
                        <p className="text-[9px] text-muted-foreground italic">&quot;{leave.reason}&quot;</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveLeave(leave._id, 'Rejected')}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs h-8"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveLeave(leave._id, 'Approved')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 shadow-md"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Real-time Collaboration Chat */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary animate-pulse" /> Live Team Workspace Chat
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

        {/* Right timeline and Heatmap */}
        <div className="lg:col-span-4 space-y-6">
          {/* Team heatmap */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-primary" /> Direct Reports Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No team members assigned.</p>
              ) : (
                teamMembers.map((member) => (
                  <div 
                    key={member._id} 
                    onClick={() => setSelectedEmployee(member)}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 cursor-pointer hover:border-amber-500/30 hover:bg-white/[0.04] hover:scale-[1.01] transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs flex items-center justify-center h-full font-bold">{member.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-white truncate block">{member.name}</span>
                          <span className="text-[9px] text-muted-foreground truncate block">{member.designation}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                        member.score > 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {member.score}%
                      </span>
                    </div>
                    <Progress value={member.score} className="h-1 bg-white/5" indicatorClassName={member.score > 80 ? 'bg-emerald-500' : 'bg-red-500'} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Live Action Activity Timeline */}
          <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary animate-pulse" /> Team Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LiveActivityFeed maxItems={6} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Assignment Modal Backdrop */}
      <AnimatePresence>
        {showTaskModal && (
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
            <h2 className="text-xl font-bold text-white mb-4">Assign Task</h2>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Select Teammate</label>
                <select
                  required
                  value={taskAssignedTo}
                  onChange={(e) => setTaskAssignedTo(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose employee --</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Task Title</label>
                <Input
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="bg-black/40 border-white/10 text-sm h-10 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea
                  required
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Task instructions..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2.5 justify-end pt-3">
                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)} className="border-white/10 text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/95 text-white">
                  Assign Task
                </Button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Profile Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setSelectedEmployee(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 text-white"
            >
              {/* Sticky Header Section */}
              <div className="relative shrink-0">
                <div className="h-32 bg-gradient-to-br from-amber-600/40 via-amber-950/20 to-black relative overflow-hidden border-b border-white/5">
                  <div className="absolute top-0 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute -bottom-10 left-10 w-32 h-32 bg-orange-600/10 rounded-full blur-[60px] pointer-events-none" />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/40 hover:bg-black/70 rounded-full border border-white/5 transition-all duration-200 z-20"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="px-8 pb-4 relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12">
                  <div className="w-24 h-24 border-4 border-[#111] bg-black shadow-xl rounded-full overflow-hidden shrink-0 ring-4 ring-amber-500/20">
                    {selectedEmployee.avatar ? (
                      <img src={selectedEmployee.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl bg-amber-500 text-black font-bold flex items-center justify-center h-full w-full">{selectedEmployee.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-grow pt-8 sm:pt-0">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedEmployee.name}</h2>
                    <p className="text-amber-500 font-medium">{selectedEmployee.designation}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto self-end">
                    <Button 
                      onClick={() => {
                        const targetChatUser = chatUsers.find(u => u._id === selectedEmployee._id);
                        if (targetChatUser) {
                          setActiveChatUser(targetChatUser);
                        } else {
                          setActiveChatUser({
                            _id: selectedEmployee._id,
                            name: selectedEmployee.name,
                            avatar: selectedEmployee.avatar,
                            role: 'employee',
                            designation: selectedEmployee.designation
                          });
                        }
                        setSelectedEmployee(null);
                        toast.success(`Chat opened with ${selectedEmployee.name}`);
                      }}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/10 px-6 py-2 rounded-xl transition-all duration-200"
                    >
                      <MessageSquare className="w-4 h-4 mr-2 inline" /> Message
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Scrollable details container */}
              <div className="p-8 pt-6 flex-1 overflow-y-auto border-t border-white/5 bg-gradient-to-b from-[#141414] to-[#111]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-6">
                    <Card className="bg-black/40 border-white/5">
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Performance Score</p>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-white leading-none">{selectedEmployee.score}</span>
                            <span className="text-sm text-gray-400 mb-1">/ 100</span>
                          </div>
                          <Progress value={selectedEmployee.score} className="h-1.5 bg-white/5 mt-3" indicatorClassName="bg-amber-500" />
                        </div>
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-amber-500 border border-white/10">
                            <Award className="w-3 h-3" /> {selectedEmployee.score > 80 ? 'On Track' : (selectedEmployee.score > 50 ? 'Needs Attention' : 'At Risk')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/5">
                      <CardContent className="p-5 space-y-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Contact Details</p>
                        <div className="space-y-3 text-sm text-gray-300">
                          <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-500" /> {selectedEmployee.email || `${selectedEmployee.name.toLowerCase().replace(' ', '')}@goalsphere.com`}</div>
                          <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-500" /> +1 (555) 019-2834</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" /> Active Goals & Performance
                    </h3>
                    <div className="space-y-3">
                      {goalsLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/50">
                          <RefreshCcw className="w-5 h-5 animate-spin text-amber-500" />
                          <p className="text-xs">Loading performance data...</p>
                        </div>
                      ) : selectedEmployeeGoals.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No active goals registered in this cycle.</p>
                      ) : (
                        selectedEmployeeGoals.map((goal) => {
                          const checkIns = goal.checkIns || [];
                          const hasCheckins = checkIns.length > 0;
                          const latestCheckIn = hasCheckins ? checkIns[checkIns.length - 1] : null;
                          const currentVal = latestCheckIn ? latestCheckIn.actualAchievement : 0;
                          let progressVal = 0;
                          if (goal.targetValue > 0) {
                            progressVal = Math.min((currentVal / goal.targetValue) * 100, 100);
                          }
                          return (
                            <div key={goal._id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-4">
                              <div className="mt-1 bg-black/40 p-2 rounded-lg text-amber-500">
                                <CheckSquare className="w-4 h-4" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-medium text-white text-sm">{goal.title}</h4>
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                                    goal.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}>
                                    {goal.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{goal.description}</p>
                                <div className="mt-3 flex items-center gap-3">
                                  <div className="flex-grow">
                                    <Progress value={progressVal} className="h-1.5 bg-black/40" indicatorClassName="bg-emerald-500" />
                                  </div>
                                  <span className="text-[10px] text-emerald-400 shrink-0 font-semibold">{Math.round(progressVal)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
