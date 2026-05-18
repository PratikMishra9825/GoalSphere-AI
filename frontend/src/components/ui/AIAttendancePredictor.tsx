"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, 
  Search, RefreshCcw, X, Mail, Briefcase, Percent, 
  ClipboardList, Calendar, Users, Activity, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Telemetry {
  leavesCount: number;
  approvedLeaves: number;
  workloadCount: number;
  completionRate: number;
  engagementScore: number;
  probability: number;
  riskLevel: string;
  baseReason: string;
}

interface EmployeePrediction {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  designation: string;
  telemetry: Telemetry;
}

export function AIAttendancePredictor() {
  const [employees, setEmployees] = useState<EmployeePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<EmployeePrediction | null>(null);
  const [aiReport, setAiReport] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Fetch telemetry predictions
  const fetchPredictions = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/ai/attendance-prediction", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      } else {
        toast.error("Failed to load attendance predictions.");
      }
    } catch (err) {
      console.error("Error fetching attendance predictions:", err);
      toast.error("API error loading analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  // Fetch AI Explainability analysis
  const fetchAiExplainability = async (emp: EmployeePrediction) => {
    setSelectedEmp(emp);
    setAiReport("");
    setLoadingAi(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/ai/explain-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: emp._id,
          telemetry: emp.telemetry
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiReport(data.report);
      } else {
        setAiReport("The AI was unable to generate a report. Please try again.");
      }
    } catch (err) {
      console.error("Error generating explainability report:", err);
      setAiReport("Error connecting to GoalSphere AI Engine.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Filter list by search term
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Core metrics aggregations
  const totalCount = employees.length;
  const avgProbability = totalCount > 0
    ? Math.round(employees.reduce((acc, emp) => acc + emp.telemetry.probability, 0) / totalCount)
    : 92;

  const highRiskCount = employees.filter(e => e.telemetry.riskLevel === "High").length;
  const mediumRiskCount = employees.filter(e => e.telemetry.riskLevel === "Medium").length;
  const lowRiskCount = employees.filter(e => e.telemetry.riskLevel === "Low").length;

  return (
    <div className="space-y-6">
      {/* Overview Aggregates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Average Likelihood */}
        <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Avg Attendance Likelihood</CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-300">{avgProbability}%</div>
              <span className="text-[10px] text-emerald-400 font-medium">Stable</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Cross-workforce calculated average</p>
          </CardContent>
        </Card>

        {/* High Risk */}
        <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl border-r-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">High Burnout Risk</CardTitle>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{highRiskCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Requires immediate HR intervention</p>
          </CardContent>
        </Card>

        {/* Medium Risk */}
        <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl border-r-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Medium Risk Strain</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{mediumRiskCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Undergoing workload stress markers</p>
          </CardContent>
        </Card>

        {/* Low Risk */}
        <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl border-r-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Healthy / Low Risk</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{lowRiskCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Highly engaged, stable consistency</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Prediction Dashboard List Card */}
      <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary animate-pulse" /> Predictive Attendance Intelligence
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Calculated risk indices based on workloads, goal velocity, leaves, and activity telemetry.</p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee or dept..."
                className="pl-8 bg-black/30 border-white/10 text-xs h-9 focus-visible:ring-primary w-full"
              />
            </div>
            {/* Reload Button */}
            <Button 
              onClick={fetchPredictions} 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 border-white/10 hover:bg-white/5 bg-transparent shrink-0"
              disabled={loading}
            >
              <RefreshCcw className={`w-3.5 h-3.5 text-white ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
              <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs">Processing deep attendance telemetry models...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-2">
              <Users className="w-8 h-8 text-muted-foreground" />
              <p className="text-xs">No employee records match the filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-white/[0.01]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 text-center">Active Workload</th>
                    <th className="py-3 px-4 text-center">Task Output</th>
                    <th className="py-3 px-4 text-center">Engagement</th>
                    <th className="py-3 px-4 text-center">Leave History</th>
                    <th className="py-3 px-4">Attendance Prob. %</th>
                    <th className="py-3 px-4 text-center">Risk Level</th>
                    <th className="py-3 px-4 text-right">Insight Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredEmployees.map((emp) => {
                    const prob = emp.telemetry.probability;
                    const risk = emp.telemetry.riskLevel;

                    // Compute visual gradient based on percentage
                    let barColor = "from-emerald-500 to-teal-400";
                    if (prob < 78) barColor = "from-rose-600 to-red-500";
                    else if (prob < 88) barColor = "from-amber-500 to-orange-400";

                    return (
                      <tr key={emp._id} className="hover:bg-white/[0.01] transition-colors">
                        {/* Profile Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-white/10">
                              <AvatarImage src={emp.avatar} alt={emp.name} />
                              <AvatarFallback className="bg-primary/20 text-white font-medium text-xs">
                                {emp.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-white leading-none">{emp.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{emp.designation} • {emp.department}</div>
                            </div>
                          </div>
                        </td>

                        {/* Active Workload */}
                        <td className="py-3 px-4 text-center font-medium">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            emp.telemetry.workloadCount > 5 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : 'bg-white/5 text-white/80'
                          }`}>
                            {emp.telemetry.workloadCount} pending
                          </span>
                        </td>

                        {/* Task Completion Rate */}
                        <td className="py-3 px-4 text-center font-semibold text-white/95">
                          {emp.telemetry.completionRate}%
                        </td>

                        {/* Engagement Score */}
                        <td className="py-3 px-4 text-center font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-300">
                          {emp.telemetry.engagementScore}%
                        </td>

                        {/* Leave History */}
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {emp.telemetry.leavesCount} requested ({emp.telemetry.approvedLeaves} aprv)
                        </td>

                        {/* Attendance Probability */}
                        <td className="py-3 px-4 w-48">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-bold text-[11px]">
                              <span className={
                                prob < 78 ? 'text-red-400' : prob < 88 ? 'text-amber-400' : 'text-emerald-400'
                              }>{prob}%</span>
                            </div>
                            {/* Horizontal Progress Bar */}
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                                style={{ width: `${prob}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Risk Level Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wider uppercase border ${
                            risk === "High" 
                              ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]" 
                              : risk === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {risk}
                          </span>
                        </td>

                        {/* Insight Call to Action */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            onClick={() => fetchAiExplainability(emp)}
                            size="sm"
                            className="h-7 px-2 text-[10px] bg-primary hover:bg-primary/95 text-white shadow-md flex items-center gap-1 ml-auto"
                          >
                            <Sparkles className="w-3 h-3 animate-pulse" /> AI Explain
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Explainability & Insights Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 text-white shadow-2xl p-6 glass-card"
            >
              {/* Glowing Background Accents */}
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/10 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />

              {/* Close Button */}
              <Button
                onClick={() => setSelectedEmp(null)}
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-white/50 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Brain className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">GoalSphere AI Analytics Diagnosis</h3>
                  <p className="text-xs text-muted-foreground">Explainable Predictive Burnout Model Summary</p>
                </div>
              </div>

              {/* Employee Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={selectedEmp.avatar} alt={selectedEmp.name} />
                    <AvatarFallback className="bg-primary/20 text-white">
                      {selectedEmp.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold">{selectedEmp.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{selectedEmp.designation} • {selectedEmp.department}</p>
                  </div>
                </div>

                {/* Risk Summary Indicator */}
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Attendance Index</span>
                    <div className="text-xl font-bold flex items-baseline gap-1.5 mt-0.5">
                      <span className={
                        selectedEmp.telemetry.probability < 78 ? 'text-red-400' : selectedEmp.telemetry.probability < 88 ? 'text-amber-400' : 'text-emerald-400'
                      }>{selectedEmp.telemetry.probability}%</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Likelihood</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    selectedEmp.telemetry.riskLevel === "High"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : selectedEmp.telemetry.riskLevel === "Medium"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {selectedEmp.telemetry.riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* Telemetry Input Badges Grid */}
              <div className="grid grid-cols-4 gap-2.5 mt-3 text-center">
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ClipboardList className="w-3 h-3 text-sky-400" /> Tasks</div>
                  <div className="text-sm font-bold mt-1 text-white">{selectedEmp.telemetry.workloadCount} Active</div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Percent className="w-3 h-3 text-emerald-400" /> Completion</div>
                  <div className="text-sm font-bold mt-1 text-white">{selectedEmp.telemetry.completionRate}%</div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Activity className="w-3 h-3 text-indigo-400" /> Engagement</div>
                  <div className="text-sm font-bold mt-1 text-white">{selectedEmp.telemetry.engagementScore}%</div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-lg">
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Calendar className="w-3 h-3 text-orange-400" /> Leaves</div>
                  <div className="text-sm font-bold mt-1 text-white">{selectedEmp.telemetry.leavesCount} req.</div>
                </div>
              </div>

              {/* Generative AI report */}
              <div className="mt-4 border-t border-white/5 pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> Generative Risk Assessment
                </h4>

                <div className="bg-black/35 border border-white/5 p-4 rounded-xl max-h-[220px] overflow-y-auto text-xs leading-relaxed space-y-3 text-white/80 pr-2">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-white/40">
                      <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-[11px] animate-pulse">Running explainable AI diagnostic synthesis...</p>
                    </div>
                  ) : (
                    aiReport.split("\n\n").map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-white/10 mt-5 pt-4">
                <Button
                  onClick={() => {
                    toast.success(`Burnout mitigation sync request sent to ${selectedEmp.name}'s manager.`);
                    setSelectedEmp(null);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-white/10 bg-transparent hover:bg-white/5 text-white/90 flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> Sync with Manager
                </Button>
                <Button
                  onClick={() => {
                    toast.success(`Leave pre-approval request logged for ${selectedEmp.name}.`);
                    setSelectedEmp(null);
                  }}
                  size="sm"
                  className="h-8 text-xs bg-primary hover:bg-primary/95 text-white flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Pre-approve Wellness Leave
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
