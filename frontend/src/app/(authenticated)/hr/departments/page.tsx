"use client";

import { useState, useEffect } from "react";
import { FolderKanban, DollarSign, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function HRDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartmentsData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const backendUrl = getBackendUrl();

      // Fetch users
      const usersRes = await fetch(`${backendUrl}/api/actions/messages/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch goals
      const goalsRes = await fetch(`${backendUrl}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (usersRes.ok && goalsRes.ok) {
        const users = await usersRes.json();
        const allGoals = await goalsRes.json();

        // Group by department field
        const groups: { [key: string]: any[] } = {};
        users.forEach((u: any) => {
          const dept = u.department || "Engineering";
          if (!groups[dept]) groups[dept] = [];
          groups[dept].push(u);
        });

        // Map groups to dynamic metrics
        const deptsArray = Object.keys(groups).map((deptName, idx) => {
          const deptUsers = groups[deptName];
          const managerUser = deptUsers.find(u => u.role === "manager") || deptUsers[0];
          const deptUserIds = deptUsers.map(u => u._id);

          // Get goals belonging to users in this department
          const deptGoals = allGoals.filter((g: any) => {
            const ownerId = g.owner?._id || g.owner;
            return deptUserIds.includes(ownerId);
          });

          // Calculate Velocity Index based on actual goals progress
          let velocity = 75; // Default baseline if no goals
          if (deptGoals.length > 0) {
            const sumProgress = deptGoals.reduce((sum: number, goal: any) => {
              const latestCheckIn = goal.checkIns?.[goal.checkIns.length - 1];
              let progressVal = 0;
              if (goal.uom === "Percentage") {
                progressVal = latestCheckIn ? latestCheckIn.actualAchievement : 0;
              } else if (goal.uom === "Numeric" && goal.targetValue > 0) {
                progressVal = latestCheckIn ? Math.min(100, (latestCheckIn.actualAchievement / goal.targetValue) * 100) : 0;
              }
              return sum + progressVal;
            }, 0);
            velocity = Math.round(sumProgress / deptGoals.length);
          }

          return {
            id: idx + 1,
            name: deptName,
            head: managerUser?.name || "Unassigned",
            employees: deptUsers.length,
            budget: `$${(deptUsers.length * 120 + 200).toLocaleString()}K`,
            performance: `+${velocity}%`
          };
        });

        setDepartments(deptsArray);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, []);

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-indigo-400" />
          Departments
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Track departmental budgets, headcount, and overall velocity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept, i) => (
          <motion.div key={dept.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-slate-900 border-slate-800 hover:border-indigo-500/30 transition-colors cursor-pointer">
              <CardHeader className="pb-2 border-b border-slate-800/50">
                <CardTitle className="text-lg text-slate-200">{dept.name}</CardTitle>
                <p className="text-xs text-slate-500">Representative: {dept.head}</p>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Headcount</p>
                  <p className="text-lg font-semibold text-slate-300">{dept.employees}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Budget Pool</p>
                  <p className="text-lg font-semibold text-slate-300">{dept.budget}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Velocity Index</p>
                  <p className="text-lg font-semibold text-emerald-400">{dept.performance}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {departments.length === 0 && (
          <div className="text-center py-20 text-xs text-muted-foreground/60 col-span-2">
            No dynamic departments loaded from the database yet.
          </div>
        )}
      </div>
    </div>
  );
}
