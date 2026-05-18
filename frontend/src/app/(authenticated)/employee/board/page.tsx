"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

export default function KanbanBoardPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/goals", {
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

  const calculateProgress = (goal: any) => {
    if (!goal.checkIns || goal.checkIns.length === 0) return 0;
    const latestCheckIn = goal.checkIns[goal.checkIns.length - 1];
    const actual = latestCheckIn.actualAchievement;
    const target = goal.targetValue;
    
    if (goal.uom === 'Zero-based') {
      return actual === 0 ? 100 : Math.max(0, 100 - actual);
    } else if (goal.uom === 'Timeline') {
      return latestCheckIn.status === 'Completed' ? 100 : 
             latestCheckIn.status === 'On Track' ? 50 : 25;
    } else {
      if (target === 0) return 0;
      return Math.min(Math.round((actual / target) * 100), 100);
    }
  };

  // Group goals dynamically
  const boardData: { [key: string]: any[] } = {
    "Draft": [],
    "Pending Approval": [],
    "Approved / Active": [],
    "Completed": []
  };

  goals.forEach(goal => {
    const progress = calculateProgress(goal);
    const item = {
      _id: goal._id,
      title: goal.title,
      area: goal.thrustArea,
      progress,
      uom: goal.uom
    };

    if (goal.status === 'Draft') {
      boardData["Draft"].push(item);
    } else if (goal.status === 'Pending Approval' || goal.status === 'Rework Required') {
      boardData["Pending Approval"].push(item);
    } else if (goal.status === 'Approved' && progress < 100) {
      boardData["Approved / Active"].push(item);
    } else if (goal.status === 'Approved' && progress >= 100) {
      boardData["Completed"].push(item);
    }
  });

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Goal Board</h1>
          <p className="text-muted-foreground mt-1">Live Kanban view of your objectives and progress statuses.</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max items-start">
          {Object.entries(boardData).map(([status, items]) => (
            <div key={status} className="w-80 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-medium text-white flex items-center gap-2">
                  {status}
                  <span className="text-xs py-0.5 px-2 rounded-full bg-white/10 text-muted-foreground">
                    {items.length}
                  </span>
                </h3>
              </div>
              
              <div className="flex-1 bg-black/10 rounded-2xl border border-white/5 p-3 space-y-3 overflow-y-auto max-h-[500px]">
                {items.map((goal, i) => (
                  <motion.div
                    key={goal._id}
                    layoutId={goal._id}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="glass-card border-white/10 bg-white/5 hover:bg-white/10 text-white">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-medium">
                            {goal.area}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-gray-200">{goal.title}</p>
                        
                        {(status === 'Approved / Active' || status === 'Completed') && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Progress</span>
                              <span>{goal.progress}%</span>
                            </div>
                            <Progress value={goal.progress} className="h-1 bg-white/10" indicatorClassName={status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground/60 border border-dashed border-white/5 rounded-xl">
                    No goals in this stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
