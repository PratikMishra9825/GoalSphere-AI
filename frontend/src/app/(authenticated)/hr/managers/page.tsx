"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, TrendingUp, Users, Search, Filter, Mail, Award, CheckCircle2, Star, Sparkles, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLoader } from "@/components/ui/DashboardLoader";
import { toast } from "sonner";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

type PerformanceTier = "all" | "elite" | "strong" | "stable";

export default function HRManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedTier, setSelectedTier] = useState<PerformanceTier>("all");

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const backendUrl = getBackendUrl();

      // Fetch users and goals from MongoDB
      const usersRes = await fetch(`${backendUrl}/api/actions/messages/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const goalsRes = await fetch(`${backendUrl}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (usersRes.ok && goalsRes.ok) {
        const allUsers = await usersRes.json();
        const allGoals = await goalsRes.json();

        // Filter system managers
        const filteredManagers = allUsers.filter((u: any) => u.role === "manager");

        const processed = filteredManagers.map((mgr: any) => {
          // Direct reports mapping
          const directReports = allUsers.filter((u: any) => u.manager === mgr._id);
          const reportIds = directReports.map((d: any) => d._id);

          // Get direct reports' goals
          const reportsGoals = allGoals.filter((g: any) => {
            const ownerId = g.owner?._id || g.owner;
            return reportIds.includes(ownerId);
          });

          // Calculate average goals progress
          let avgProgress = 0;
          if (reportsGoals.length > 0) {
            const sumProgress = reportsGoals.reduce((sum: number, goal: any) => {
              const latestCheckIn = goal.checkIns?.[goal.checkIns.length - 1];
              let progressVal = 0;
              if (goal.uom === "Percentage") {
                progressVal = latestCheckIn ? latestCheckIn.actualAchievement : 0;
              } else if (goal.uom === "Numeric" && goal.targetValue > 0) {
                progressVal = latestCheckIn ? Math.min(100, (latestCheckIn.actualAchievement / goal.targetValue) * 100) : 0;
              }
              return sum + progressVal;
            }, 0);
            avgProgress = Math.round(sumProgress / reportsGoals.length);
          }

          const goalAlignment = avgProgress > 0 ? avgProgress : 75;
          const teamSize = directReports.length;
          const leadershipScore = Math.min(100, Math.max(70, Math.round(goalAlignment * 0.9 + Math.min(10, teamSize * 2))));

          // Assign descriptive tier labels
          let tier: PerformanceTier = "stable";
          let tierLabel = "Core Leader";
          let tierColor = "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30";
          
          if (leadershipScore >= 90) {
            tier = "elite";
            tierLabel = "Elite Catalyst";
            tierColor = "from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]";
          } else if (leadershipScore >= 80) {
            tier = "strong";
            tierLabel = "Strategic Driver";
            tierColor = "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30";
          }

          return {
            ...mgr,
            teamSize,
            leadershipScore,
            goalAlignment,
            tier,
            tierLabel,
            tierColor
          };
        });

        setManagers(processed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // Quick action alerts
  const handleContact = (name: string, email: string) => {
    toast.success(`Secure email gateway initialized`, {
      description: `Opening native mail composer to sync with ${name} (${email}).`,
      icon: <Mail className="w-5 h-5 text-indigo-400" />
    });
    
    // Open system default mail client
    setTimeout(() => {
      window.location.href = `mailto:${email}?subject=GoalSphere%20AI%20-%20Leadership%20Performance%20Sync&body=Hi%20${encodeURIComponent(name)},%0D%0A%0D%0AI%20would%20like%20to%20schedule%20a%20sync%20regarding%20your%20department's%20goal%20alignment%20index%20and%20direct%20reports'%20accomplishments%20on%20GoalSphere%20AI.%0D%0A%0D%0ABest%20regards,%0D%0AHR%20Director`;
    }, 600);
  };

  // Unique list of departments for filter
  const departments = Array.from(new Set(managers.map(m => m.department || "Product")));

  // Filter Logic
  const filtered = managers.filter(mgr => {
    const matchesSearch = mgr.name.toLowerCase().includes(search.toLowerCase()) ||
      (mgr.department && mgr.department.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept === "all" || mgr.department === selectedDept;
    const matchesTier = selectedTier === "all" || mgr.tier === selectedTier;
    return matchesSearch && matchesDept && matchesTier;
  });

  // Dynamic Overall Metrics
  const avgLeadership = managers.length > 0 
    ? Math.round(managers.reduce((sum, m) => sum + m.leadershipScore, 0) / managers.length)
    : 0;

  const totalReports = managers.reduce((sum, m) => sum + m.teamSize, 0);

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      {/* Premium Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            Leadership Command Hub
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Monitor live supervisor effectiveness, core directives alignment, and dynamic direct reports ratios.</p>
        </div>

        {/* Global Telemetry Summaries */}
        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl px-4 py-3 backdrop-blur-sm flex items-center gap-3 shadow-inner">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Avg Efficiency</p>
              <p className="text-lg font-bold text-slate-200">{avgLeadership}%</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl px-4 py-3 backdrop-blur-sm flex items-center gap-3 shadow-inner">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Reports Covered</p>
              <p className="text-lg font-bold text-slate-200">{totalReports} Employees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Command Strip */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search by manager name or skill area..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder-slate-600 text-sm focus-visible:ring-indigo-500/40"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Department Select */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Performance Tier Select */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as PerformanceTier)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          >
            <option value="all">All Performance Tiers</option>
            <option value="elite">Elite Catalysts (&ge;90)</option>
            <option value="strong">Strategic Drivers (&ge;80)</option>
            <option value="stable">Core Leaders (&lt;80)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Glassmorphic Leader Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div 
          layout 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((mgr, i) => (
            <motion.div
              key={mgr._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileHover={{ y: -6, transition: { duration: 0.15 } }}
              className="relative group cursor-pointer"
            >
              {/* Outer Card Glow Border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              
              <Card className="relative bg-slate-900/60 border-slate-800/80 backdrop-blur-md overflow-hidden rounded-xl h-full shadow-lg">
                <CardContent className="p-6 space-y-6">
                  {/* Card Header Section */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <Avatar className="w-12 h-12 border-2 border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold uppercase">
                          {mgr.name ? mgr.name.split(" ").map((n: string) => n[0]).join("") : "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
                          {mgr.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{mgr.department || "Product"} Team Lead</p>
                      </div>
                    </div>

                    {/* Highly Aesthetic Glowing Badge */}
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r border uppercase tracking-widest flex items-center gap-1 ${mgr.tierColor}`}>
                      <Award className="w-3 h-3" />
                      {mgr.tierLabel}
                    </span>
                  </div>

                  {/* Telemetry Metrics and gauges */}
                  <div className="space-y-4 pt-2 border-t border-slate-800/60">
                    {/* Direct reports ratio tracker */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        Active Direct Reports
                      </span>
                      <span className="text-slate-200 bg-slate-950/60 border border-slate-800/50 px-2 py-0.5 rounded text-[10px]">
                        {mgr.teamSize} Headcount
                      </span>
                    </div>

                    {/* Gauge 1: Leadership Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
                          Leadership Score
                        </span>
                        <span className="text-indigo-400">{mgr.leadershipScore}/100</span>
                      </div>
                      <div className="relative h-2 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/50">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                          style={{ width: `${mgr.leadershipScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Gauge 2: Goal Alignment */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Goal Alignment Index
                        </span>
                        <span className="text-emerald-400">{mgr.goalAlignment}%</span>
                      </div>
                      <div className="relative h-2 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/50">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                          style={{ width: `${mgr.goalAlignment}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar (visible or highlighted on hover) */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-800/60">
                    <button 
                      onClick={() => handleContact(mgr.name, mgr.email)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-lg text-xs font-bold transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Contact Lead
                    </button>
                    
                    <button 
                      onClick={() => {
                        localStorage.setItem("activeChatUserId", mgr._id);
                        toast.info(`Opening live communication channel with ${mgr.name}...`);
                        setTimeout(() => {
                          window.location.href = "/hr/dashboard";
                        }, 600);
                      }}
                      className="p-2 bg-slate-950/60 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Direct Chat Panel"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filtered.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-xl"
        >
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold text-sm">No supervisors matching filters found.</p>
          <p className="text-slate-600 text-xs mt-1">Try refining search parameters or adjusting active performance filters.</p>
        </motion.div>
      )}
    </div>
  );
}
