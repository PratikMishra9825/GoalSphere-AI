"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Target, CheckCircle2, Clock, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DashboardLoader } from "@/components/ui/DashboardLoader";
import { useSocketEvent } from "@/hooks/useSocket";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function GoalsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thrustArea, setThrustArea] = useState("");
  const [uom, setUom] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [weightage, setWeightage] = useState("");

  const fetchGoals = async () => {
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
    fetchGoals();
  }, []);

  // ── Real-Time Socket Listeners for Goal status updates ────────────────
  useSocketEvent<any>("goal:status_changed", (data) => {
    toast.info(`🔔 Goal Status Update: "${data.title}" is now "${data.status}"!`);
    fetchGoals();
  });

  useSocketEvent<any>("goal:updated", () => {
    fetchGoals();
  });

  const totalWeightage = goals
    .filter((g: any) => g.status !== 'Archived')
    .reduce((sum, g) => sum + (g.weightage || 0), 0);

  const handleArchiveGoal = async (goalId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Archived" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Goal successfully archived!", { description: "Active weightage space freed up instantly." });
        fetchGoals();
      } else {
        toast.error(data.message || "Failed to archive goal");
      }
    } catch (err) {
      toast.error("An error occurred while archiving the goal.");
    }
  };

  const handleAIEnhance = () => {
    if (!title) {
      toast.error("Please enter a Goal Title first");
      return;
    }
    toast("Analyzing text...", { description: "GoalSphere AI is rewriting your goal description..." });
    setTimeout(() => {
      setDescription(`Achieve ${title} by consistently applying industry best practices, tracking metrics weekly, and ensuring high-quality deliverables to meet quarterly expectations. Ensure alignment with the core thrust area to maximize impact.`);
      toast.success("AI Enhancement Complete!");
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !thrustArea || !uom || !targetValue || !weightage) {
      toast.error("Please fill all fields");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title, 
          description, 
          thrustArea, 
          uom, 
          targetValue: Number(targetValue), 
          weightage: Number(weightage), 
          dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Draft Saved", { description: "Your goal draft has been saved successfully." });
        setIsCreating(false);
        setTitle(""); setDescription(""); setThrustArea(""); setUom(""); setTargetValue(""); setWeightage("");
        fetchGoals();
      } else {
        toast.error(data.message || "Failed to create goal");
      }
    } catch (err) {
      toast.error("An error occurred while saving the goal");
    }
  };

  const handleRequestApproval = async (goalId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Pending Approval" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Submitted for Approval");
        fetchGoals();
      } else {
        toast.error(data.message || "Failed to submit");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Goals</h1>
          <p className="text-muted-foreground mt-1">Manage your objectives for the 2026-2027 cycle.</p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)}
          disabled={goals.filter((g: any) => g.status !== "Archived").length >= 8}
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
        >
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Goal</>}
        </Button>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="glass-card border-primary/30 bg-primary/5 text-white">
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription className="text-muted-foreground">Ensure your total weightage across all goals equals exactly 100%.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title" className="text-gray-300">Goal Title</Label>
                  <div className="flex gap-2">
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Increase unit test coverage" className="bg-black/20 border-white/10 text-white" />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="whitespace-nowrap bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/50"
                      onClick={handleAIEnhance}
                    >
                      ✨ AI Enhance
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Detailed SMART description..." 
                    className="flex w-full rounded-md border bg-black/20 border-white/10 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Thrust Area</Label>
                  <Select value={thrustArea} onValueChange={setThrustArea}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                      <SelectItem value="Quality & Reliability">Quality & Reliability</SelectItem>
                      <SelectItem value="Revenue Growth">Revenue Growth</SelectItem>
                      <SelectItem value="Innovation">Innovation</SelectItem>
                      <SelectItem value="Team Culture">Team Culture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Unit of Measurement</Label>
                  <Select value={uom} onValueChange={setUom}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue placeholder="Select UoM" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10 text-white">
                      <SelectItem value="Numeric">Numeric Value</SelectItem>
                      <SelectItem value="Percentage">Percentage (%)</SelectItem>
                      <SelectItem value="Timeline">Timeline (Date)</SelectItem>
                      <SelectItem value="Zero-based">Zero-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target" className="text-gray-300">Target Value</Label>
                  <Input id="target" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} type="number" placeholder="100" className="bg-black/20 border-white/10 text-white" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightage" className="text-gray-300">Weightage (%) - Min 10%</Label>
                  <Input id="weightage" value={weightage} onChange={(e) => setWeightage(e.target.value)} type="number" min="10" max="100" placeholder="20" className="bg-black/20 border-white/10 text-white" />
                </div>

                <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-white">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Save Draft
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Total Weightage Alert */}
      {totalWeightage !== 100 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Weightage Validation Pending</p>
            <p className="text-xs text-amber-200/70 mt-1">Your current goals total {totalWeightage}% weightage. You need exactly 100% to submit for approval.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {goals.filter((g: any) => g.status !== 'Archived').map((goal, i) => {
          const checkIns = goal.checkIns || [];
          const hasCheckins = checkIns.length > 0;
          const latestCheckIn = hasCheckins ? checkIns[checkIns.length - 1] : null;
          const currentVal = latestCheckIn ? latestCheckIn.actualAchievement : 0;
          let progressVal = 0;
          if (goal.targetValue > 0) {
            progressVal = Math.min((currentVal / goal.targetValue) * 100, 100);
          }

          return (
            <Card key={goal._id} className="glass-card border-white/10 bg-black/20 text-white hover:bg-white/5 transition-colors group">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`mt-1 bg-white/5 p-2 rounded-lg text-primary`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="w-full max-w-md">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{goal.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{goal.thrustArea}</span>
                      <span>Target: {goal.targetValue} {goal.uom === 'Percentage' ? '%' : ''}</span>
                      <span>Weight: {goal.weightage}%</span>
                    </div>
                    {goal.status === 'Approved' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress: {currentVal} {goal.uom === 'Percentage' ? '%' : ''}</span>
                          <span>{Math.round(progressVal)}%</span>
                        </div>
                        <Progress value={progressVal} className="h-1.5" indicatorClassName="bg-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 ${
                    goal.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                    (goal.status === 'Pending Approval' || goal.status === 'Rework Required') ? 'bg-amber-500/10 text-amber-400' :
                    'bg-white/10 text-gray-300'
                  }`}>
                    {goal.status}
                  </span>
                  {goal.status === 'Draft' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-primary/50 hover:bg-primary/20 text-primary h-7 text-xs"
                      onClick={() => handleRequestApproval(goal._id)}
                    >
                      <Send className="w-3 h-3 mr-1" /> Submit
                    </Button>
                  )}
                  {goal.status === 'Approved' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 h-7 text-xs"
                        onClick={() => window.location.href = '/employee/checkins'}
                      >
                        Add Check-in
                      </Button>
                      
                      {progressVal === 100 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-indigo-500/50 hover:bg-indigo-500/20 text-indigo-400 h-7 text-xs flex items-center gap-1"
                          onClick={() => handleArchiveGoal(goal._id)}
                        >
                          🗄️ Archive Goal
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {goals.filter((g: any) => g.status !== 'Archived').length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            You have no active goals. Click "New Goal" to get started.
          </div>
        )}
      </div>

      {/* 🗄️ Archived Goals Section */}
      {goals.filter((g: any) => g.status === 'Archived').length > 0 && (
        <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-300 flex items-center gap-2">
              🗄️ Archived & Completed Goals
            </h2>
            <p className="text-xs text-gray-500 mt-1">These goals are fully achieved and retired from your active weightage Cap summation, freeing up weightage for new goals.</p>
          </div>
          
          <div className="grid gap-4">
            {goals.filter((g: any) => g.status === 'Archived').map((goal) => (
              <Card key={goal._id} className="border-white/5 bg-zinc-950/40 text-gray-400 opacity-60">
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-semibold text-sm line-through text-gray-200">{goal.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{goal.thrustArea} • Weight: {goal.weightage}% • Completed</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Achieved & Archived
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
