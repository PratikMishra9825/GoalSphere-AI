"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardLoader } from "@/components/ui/DashboardLoader";

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function HRReportsPage() {
  const [loading, setLoading] = useState(true);
  const [distData, setDistData] = useState<any[]>([]);
  const [attritionData, setAttritionData] = useState<any[]>([]);
  const [highRiskPercent, setHighRiskPercent] = useState("0%");

  const fetchReportsData = async () => {
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
        const allUsers = await usersRes.json();
        const allGoals = await goalsRes.json();

        // Bin ratings & attrition risks dynamically
        let poorCount = 0;
        let needsFocusCount = 0;
        let goodCount = 0;
        let excellentCount = 0;
        let outstandingCount = 0;

        let lowRiskCount = 0;
        let mediumRiskCount = 0;
        let highRiskCount = 0;

        // Process only employees and managers
        const activeStaff = allUsers.filter((u: any) => u.role === "employee" || u.role === "manager");

        activeStaff.forEach((emp: any) => {
          // Get employee goals
          const empGoals = allGoals.filter((g: any) => {
            const ownerId = g.owner?._id || g.owner;
            return ownerId === emp._id;
          });

          // Calculate average progress
          let avgProgress = 75; // Default if no goals
          if (empGoals.length > 0) {
            const sumProgress = empGoals.reduce((sum: number, goal: any) => {
              const latestCheckIn = goal.checkIns?.[goal.checkIns.length - 1];
              let progressVal = 0;
              if (goal.uom === "Percentage") {
                progressVal = latestCheckIn ? latestCheckIn.actualAchievement : 0;
              } else if (goal.uom === "Numeric" && goal.targetValue > 0) {
                progressVal = latestCheckIn ? Math.min(100, (latestCheckIn.actualAchievement / goal.targetValue) * 100) : 0;
              }
              return sum + progressVal;
            }, 0);
            avgProgress = Math.round(sumProgress / empGoals.length);
          }

          // Performance Distribution
          if (avgProgress < 50) poorCount++;
          else if (avgProgress < 70) needsFocusCount++;
          else if (avgProgress < 85) goodCount++;
          else if (avgProgress < 95) excellentCount++;
          else outstandingCount++;

          // Attrition Risk
          const hasDelayedGoal = empGoals.some((g: any) => g.status === "Delayed" || g.status === "Blocked");
          if (avgProgress < 65 || (avgProgress < 75 && hasDelayedGoal)) {
            highRiskCount++;
          } else if (avgProgress < 80 || hasDelayedGoal) {
            mediumRiskCount++;
          } else {
            lowRiskCount++;
          }
        });

        // Set distribution data
        setDistData([
          { rating: "Poor", count: poorCount },
          { rating: "Needs Focus", count: needsFocusCount },
          { rating: "Good", count: goodCount },
          { rating: "Excellent", count: excellentCount },
          { rating: "Outstanding", count: outstandingCount }
        ]);

        // Set attrition risk data
        const total = Math.max(1, lowRiskCount + mediumRiskCount + highRiskCount);
        const highRiskRate = Math.round((highRiskCount / total) * 100);
        setHighRiskPercent(`${highRiskRate}%`);

        setAttritionData([
          { name: 'Low Risk', value: lowRiskCount },
          { name: 'Medium Risk', value: mediumRiskCount },
          { name: 'High Risk', value: highRiskCount }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
          Org-Wide Analytics
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Analyze performance distribution and retention risks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">Performance Bell Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="rating" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attrition Risk */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-slate-200 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-400"/>
              Attrition Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attritionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attritionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-white">{highRiskPercent}</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest">High Risk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
