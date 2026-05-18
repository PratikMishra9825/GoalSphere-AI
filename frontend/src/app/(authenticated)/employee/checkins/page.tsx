"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, AlertCircle, Clock, CheckCircle2, ChevronRight, UploadCloud, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

export default function CheckInsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  
  const [actualAchievement, setActualAchievement] = useState("");
  const [progressNotes, setProgressNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/goals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Check-ins are only for active/approved goals
        setGoals(data.filter((g: any) => g.status === 'Approved'));
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

  const handleSubmitCheckin = async (goalId: string) => {
    if (!actualAchievement) {
      toast.error("Please enter actual achievement");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/goals/${goalId}/checkins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quarter: "Q2", // Hardcoded for this cycle based on UI
          actualAchievement: Number(actualAchievement),
          progressNotes,
          evidenceUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Check-in Submitted", { description: "Your progress has been sent to your manager." });
        setExpandedGoalId(null);
        setActualAchievement("");
        setProgressNotes("");
        setEvidenceUrl("");
        fetchGoals();
      } else {
        toast.error(data.message || "Failed to submit check-in");
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Quarterly Check-Ins</h1>
          <p className="text-muted-foreground mt-1">Submit your progress updates and evidence for manager review.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="glass-card border-white/10 bg-black/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Q2 2026</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> 14 days remaining</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/10 bg-black/20 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{goals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved goals to track</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-amber-500/30 bg-amber-500/10 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-200/70">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-400 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Reminders
            </div>
            <p className="text-xs text-amber-200/70 mt-1">Please update goals regularly</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Your Active Goals</h3>
        
        {goals.map((goal, i) => {
          const checkIns = goal.checkIns || [];
          const hasCheckins = checkIns.length > 0;
          const latestCheckIn = hasCheckins ? checkIns[checkIns.length - 1] : null;
          const currentVal = latestCheckIn ? latestCheckIn.actualAchievement : 0;
          let progressVal = 0;
          if (goal.targetValue > 0) {
            progressVal = Math.min((currentVal / goal.targetValue) * 100, 100);
          }

          const isExpanded = expandedGoalId === goal._id;

          return (
            <motion.div
              key={goal._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="glass-card border-white/10 bg-black/20 text-white hover:bg-white/5 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{goal.title}</h4>
                        <span className={`text-xs px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500 font-medium`}>
                          Active
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Target: <strong className="text-gray-300">{goal.targetValue} {goal.uom === 'Percentage' ? '%' : ''}</strong></span>
                        <span>Current: <strong className="text-gray-300">{currentVal} {goal.uom === 'Percentage' ? '%' : ''}</strong></span>
                        {latestCheckIn && (
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Updated recently</span>
                        )}
                      </div>

                      <Progress 
                        value={progressVal} 
                        className="h-1.5 mt-4" 
                        indicatorClassName="bg-blue-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 min-w-[200px] shrink-0">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedGoalId(null);
                          } else {
                            setExpandedGoalId(goal._id);
                            setActualAchievement("");
                            setProgressNotes("");
                            setEvidenceUrl("");
                          }
                        }}
                      >
                        {isExpanded ? "Cancel" : <><CheckSquare className="w-4 h-4 mr-2" /> Add Check-in</>}
                      </Button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-4 md:col-span-2">
                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Actual Achievement (To Date)</label>
                            <input 
                              type="number"
                              value={actualAchievement}
                              onChange={(e) => setActualAchievement(e.target.value)}
                              placeholder={`Target is ${goal.targetValue}`}
                              className="w-full rounded-lg border border-white/10 bg-black/20 text-sm text-white p-3 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Evidence / Proof URL (e.g., Google Drive link, GitHub PR, PDF)</label>
                            <input 
                              type="text"
                              value={evidenceUrl}
                              onChange={(e) => setEvidenceUrl(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              className="w-full rounded-lg border border-white/10 bg-black/20 text-sm text-white p-3 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-gray-300">Progress Notes (Optional)</label>
                            <textarea 
                              value={progressNotes}
                              onChange={(e) => setProgressNotes(e.target.value)}
                              placeholder="Briefly describe what you achieved..."
                              className="w-full h-20 rounded-lg border border-white/10 bg-black/20 text-sm text-white p-3 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={() => handleSubmitCheckin(goal._id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                              Submit Update
                            </Button>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Past Check-ins / Evidence list */}
                  {checkIns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <h5 className="text-sm font-semibold text-gray-300">Submitted Proof & Check-in History</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {checkIns.map((ci: any, idx: number) => (
                          <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs space-y-1">
                            <div className="flex justify-between font-medium">
                              <span className="text-primary">{ci.quarter} Check-in</span>
                              <span className="text-muted-foreground">{new Date(ci.submittedAt || ci.date || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div className="text-gray-300">
                              Achievement: <strong>{ci.actualAchievement} {goal.uom === 'Percentage' ? '%' : ''}</strong>
                            </div>
                            {ci.progressNotes && (
                              <div className="text-muted-foreground italic">
                                Notes: "{ci.progressNotes}"
                              </div>
                            )}
                            {ci.evidenceUrl ? (
                              <div className="text-emerald-400 mt-1 flex items-center gap-1">
                                <span>Proof Link:</span>
                                <a href={ci.evidenceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300 break-all">{ci.evidenceUrl}</a>
                              </div>
                            ) : (
                              <div className="text-amber-400/80 mt-1 italic">
                                No proof document uploaded.
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
        {goals.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            You don't have any approved goals to check in on yet.
          </div>
        )}
      </div>
    </div>
  );
}
