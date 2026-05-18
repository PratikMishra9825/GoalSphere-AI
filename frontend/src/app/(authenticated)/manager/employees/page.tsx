"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Phone, MoreVertical, TrendingUp, Award, Target, X, CheckSquare, MessageSquare, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Employee {
  _id: string;
  name: string;
  designation: string;
  avatar: string;
  email: string;
  goals: number;
  score: number;
  status: string;
}

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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

  const fetchEmployees = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${getBackendUrl()}/api/dashboard/manager`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.teamMembers || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleStartMessage = (employeeId: string) => {
    // Store user ID in local storage and redirect to manager dashboard to auto-select that user in chat!
    localStorage.setItem("activeChatUserId", employeeId);
    toast.success("Opening chat workspace...");
    router.push("/manager/dashboard");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-white/50">
        <RefreshCcw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Loading team profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-500 animate-pulse" />
            My Team
          </h1>
          <p className="text-gray-400 mt-1">Manage your direct reports and track their holistic performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {employees.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-white/5 rounded-2xl bg-black/20">
            <Users className="w-10 h-10 mx-auto text-white/10 mb-3" />
            <p className="text-sm">No direct reports found in the database.</p>
          </div>
        ) : (
          employees.map((emp, i) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-[#111] border border-white/5 text-white hover:border-amber-500/30 transition-all overflow-hidden group shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 duration-300">
                <div className="h-24 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-black relative overflow-hidden">
                  {/* Glowing amber accents inside card banner */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-300" />
                  <div className="absolute -bottom-6 left-6 w-16 h-16 bg-orange-600/5 rounded-full blur-xl pointer-events-none" />
                  
                  {/* Divider light beam */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all duration-200">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-6 pt-0 relative">
                  <div className="-mt-10 mb-4 w-20 h-20 border-4 border-[#111] bg-black rounded-full overflow-hidden shadow-lg relative z-10">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-amber-500 text-black text-2xl font-bold flex items-center justify-center h-full w-full">{emp.name[0]}</AvatarFallback>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-xl">{emp.name}</h3>
                    <p className="text-sm text-amber-500 font-medium">{emp.designation}</p>
                    
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {emp.email}</span>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Performance Score</span>
                          <span className="font-bold text-white">{emp.score}/100</span>
                        </div>
                        <Progress value={emp.score} className="h-2 bg-white/5" indicatorClassName="bg-amber-500" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Target className="w-4 h-4 text-amber-500" />
                          {emp.goals} Active Goals
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                          {emp.status}
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-6 bg-white/5 hover:bg-amber-500 text-white hover:text-black transition-colors"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      View Full Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedEmployee(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Sticky non-clipping Header Section */}
              <div className="relative shrink-0">
                <div className="h-32 bg-gradient-to-br from-amber-600/40 via-amber-950/20 to-black relative overflow-hidden border-b border-white/5">
                  {/* Vibrant ambient glows inside modal banner */}
                  <div className="absolute top-0 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute -bottom-10 left-10 w-32 h-32 bg-orange-600/10 rounded-full blur-[60px] pointer-events-none" />
                  
                  {/* Tech grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] pointer-events-none" />

                  {/* Accent glow bar at the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/40 hover:bg-black/70 rounded-full border border-white/5 transition-all duration-200 z-20"
                    onClick={() => setSelectedEmployee(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Avatar and Basic Info block positioned without overflow clipping */}
                <div className="px-8 pb-4 relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12">
                  <div className="w-24 h-24 border-4 border-[#111] bg-black shadow-xl rounded-full overflow-hidden shrink-0 ring-4 ring-amber-500/20">
                    {selectedEmployee.avatar ? (
                      <img src={selectedEmployee.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-amber-500 text-black text-3xl font-bold flex items-center justify-center h-full w-full">{selectedEmployee.name[0]}</AvatarFallback>
                    )}
                  </div>
                  <div className="flex-grow pt-8 sm:pt-0">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedEmployee.name}</h2>
                    <p className="text-amber-500 font-medium">{selectedEmployee.designation}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto self-end">
                    <Button 
                      onClick={() => handleStartMessage(selectedEmployee._id)}
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
                            <Award className="w-3 h-3" /> {selectedEmployee.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-white/5">
                      <CardContent className="p-5 space-y-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Contact Details</p>
                        <div className="space-y-3 text-sm text-gray-300">
                          <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-500" /> {selectedEmployee.email}</div>
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
