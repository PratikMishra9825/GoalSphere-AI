"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function ReportsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoalsData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${getBackendUrl()}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setGoals(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, []);

  const getLatestAchievement = (goal: any) => {
    if (!goal.checkIns || goal.checkIns.length === 0) return 0;
    return goal.checkIns[goal.checkIns.length - 1].actualAchievement;
  };

  const handleExportCSV = () => {
    if (goals.length === 0) {
      toast.error("No goals data available to export");
      return;
    }

    // Dynamic CSV generation
    const headers = ["Employee Name", "Email", "Goal Title", "Thrust Area", "UoM", "Planned Target", "Actual Achievement", "Status"];
    const rows = goals.map(goal => [
      goal.owner?.name || "Unassigned",
      goal.owner?.email || "N/A",
      `"${goal.title.replace(/"/g, '""')}"`,
      goal.thrustArea,
      goal.uom,
      goal.targetValue,
      getLatestAchievement(goal),
      goal.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GoalSphere_Achievement_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV Export Completed", { description: "Download started successfully." });
  };

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-500" />
            Performance & Achievement Reports
          </h1>
          <p className="text-gray-400 mt-1">Export Planned vs. Actual Goal achievements across all direct reports.</p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={handleExportCSV} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20">
            <Download className="w-4 h-4 mr-2" /> Export to CSV
          </Button>
        </div>
      </div>

      <Card className="bg-[#111] border-white/5 text-white mt-6 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-3">Employee</div>
          <div className="col-span-4">Objective / Title</div>
          <div className="col-span-1.5 text-center">Planned</div>
          <div className="col-span-1.5 text-center">Actual Achievement</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <CardContent className="p-0">
          {goals.map((goal, i) => (
            <motion.div 
              key={goal._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors text-sm"
            >
              <div className="col-span-3 font-medium text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs shrink-0 border border-white/10">
                  {goal.owner?.name?.[0] || "E"}
                </div>
                <div className="min-w-0">
                  <span className="block truncate">{goal.owner?.name || "Unassigned"}</span>
                  <span className="block text-[10px] text-gray-500 truncate">{goal.owner?.designation}</span>
                </div>
              </div>
              
              <div className="col-span-4 font-medium text-amber-500 truncate">
                {goal.title}
              </div>
              
              <div className="col-span-1.5 text-center font-semibold text-gray-300">
                {goal.targetValue} {goal.uom === "Percentage" ? "%" : ""}
              </div>
              
              <div className="col-span-1.5 text-center font-semibold text-emerald-400">
                {getLatestAchievement(goal)} {goal.uom === "Percentage" ? "%" : ""}
              </div>

              <div className="col-span-2 text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  goal.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  goal.status === "Pending Approval" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-white/5 text-gray-400 border-white/10"
                }`}>
                  {goal.status}
                </span>
              </div>
            </motion.div>
          ))}
          {goals.length === 0 && (
            <div className="text-center py-20 text-xs text-muted-foreground/60">
              No employee goals recorded in the system yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
