"use client";

import { useState, useEffect } from "react";
import { Target, CheckCircle2, AlertCircle, Search, Filter, MessageSquare, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function TeamGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [editWeight, setEditWeight] = useState(10);

  const fetchPendingGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${getBackendUrl()}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const allGoals = await res.json();
        // Filter for goals pending manager approval
        const pending = allGoals.filter((g: any) => g.status === "Pending Approval");
        setGoals(pending);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingGoals();
  }, []);

  const handleStartEdit = (goal: any) => {
    setEditingId(goal._id);
    setEditTarget(goal.targetValue.toString());
    setEditWeight(goal.weightage);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveInlineEdit = async (goalId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetValue: Number(editTarget),
          weightage: Number(editWeight)
        })
      });
      
      if (res.ok) {
        toast.success("Goal metrics updated successfully!");
        setEditingId(null);
        fetchPendingGoals();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to update metrics");
      }
    } catch (err) {
      toast.error("Failed to update goal metrics");
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Approved" })
      });
      
      if (res.ok) {
        toast.success("Goal Approved successfully!");
        setGoals(prev => prev.filter(g => g._id !== id));
      } else {
        toast.error("Failed to approve goal");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestRework = async (id: string, name: string) => {
    const feedback = prompt("Enter revision instructions for the employee:");
    if (feedback === null) return; // Cancelled
    if (!feedback.trim()) {
      toast.error("Rework comments are required!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "Rework Required",
          managerFeedback: feedback
        })
      });
      
      if (res.ok) {
        toast.success("Goal returned to employee for rework!");
        setGoals(prev => prev.filter(g => g._id !== id));
      } else {
        toast.error("Failed to update goal status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-amber-500" />
            Team Goals Review
          </h1>
          <p className="text-gray-400 mt-1">Review, inline edit, and approve your team&apos;s pending objectives.</p>
        </div>
      </div>

      <div className="grid gap-4 mt-6">
        {goals.map((goal, i) => (
          <motion.div
            key={goal._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-[#111] border-white/5 text-white hover:border-amber-500/30 transition-all">
              <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12 border border-white/10">
                    <AvatarFallback className="bg-amber-500/20 text-amber-500 font-bold">
                      {goal.owner?.name?.[0] || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-lg text-white">{goal.title}</h3>
                    <p className="text-sm text-gray-400">
                      Submitted by <span className="text-white font-medium">{goal.owner?.name}</span> • {goal.owner?.designation || "Team Member"}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed italic">{goal.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                        Thrust Area: {goal.thrustArea}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                        UoM: {goal.uom}
                      </span>
                      
                      {editingId === goal._id ? (
                        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-amber-500/30">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400">Target:</span>
                            <Input
                              type="number"
                              value={editTarget}
                              onChange={(e) => setEditTarget(e.target.value)}
                              className="w-16 h-6 px-1 text-xs bg-black text-white border-white/20"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-400">Weight:</span>
                            <Input
                              type="number"
                              value={editWeight}
                              onChange={(e) => setEditWeight(Number(e.target.value))}
                              className="w-16 h-6 px-1 text-xs bg-black text-white border-white/20"
                            />
                            <span className="text-xs">%</span>
                          </div>
                          <Button size="icon" onClick={() => handleSaveInlineEdit(goal._id)} className="bg-emerald-500 hover:bg-emerald-600 h-6 w-6 p-0 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" onClick={handleCancelEdit} className="bg-red-500 hover:bg-red-600 h-6 w-6 p-0 text-white">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10">
                            Target: {goal.targetValue} {goal.uom === "Percentage" ? "%" : ""}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300 border border-white/10 flex items-center gap-1">
                            Weight: {goal.weightage}%
                            <button onClick={() => handleStartEdit(goal)} className="text-amber-400 hover:text-amber-300 ml-1">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 lg:shrink-0 w-full lg:w-auto">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto border-red-500/20 hover:bg-red-500/10 text-red-400"
                    onClick={() => handleRequestRework(goal._id, goal.owner?.name)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Request Rework
                  </Button>
                  <Button 
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20"
                    onClick={() => handleApprove(goal._id, goal.owner?.name)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Goal
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
        {goals.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">All caught up!</h3>
            <p className="text-gray-400 mt-2">There are no pending goals to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
