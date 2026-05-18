"use client";

import { useState, useEffect } from "react";
import { Briefcase, UserPlus, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DashboardLoader } from "@/components/ui/DashboardLoader";

interface Candidate {
  _id: string;
  name: string;
  role: string;
  stage: "Applied" | "Interviewing" | "Offered" | "Hired";
}

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function HRRecruitmentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Frontend Developer");

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${getBackendUrl()}/api/actions/recruitment/candidates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCandidates(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/actions/recruitment/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, role: newRole })
      });
      if (res.ok) {
        const newCand = await res.json();
        setCandidates(prev => [...prev, newCand]);
        setNewName("");
        setShowModal(false);
        toast.success("Candidate Registered", { description: `${newName} has been added to Applied stage.` });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to register candidate");
    }
  };

  const moveStage = async (id: string, direction: "next" | "prev") => {
    const stages: Candidate["stage"][] = ["Applied", "Interviewing", "Offered", "Hired"];
    const target = candidates.find(c => c._id === id);
    if (!target) return;

    const currIdx = stages.indexOf(target.stage);
    let nextIdx = direction === "next" ? currIdx + 1 : currIdx - 1;
    if (nextIdx >= 0 && nextIdx < stages.length) {
      const newStage = stages[nextIdx];
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${getBackendUrl()}/api/actions/recruitment/candidates/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ stage: newStage })
        });
        if (res.ok) {
          setCandidates(prev => prev.map(c => c._id === id ? { ...c, stage: newStage } : c));
          toast.info(`Candidate Moved`, { description: `${target.name} transitioned to ${newStage}.` });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to transition candidate");
      }
    }
  };

  const removeCandidate = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/actions/recruitment/candidates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const target = candidates.find(c => c._id === id);
        setCandidates(prev => prev.filter(c => c._id !== id));
        toast.success("Requisition Closed", { description: target ? `${target.name} removed from recruitment pipeline.` : undefined });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to close requisition");
    }
  };

  const stages: Candidate["stage"][] = ["Applied", "Interviewing", "Offered", "Hired"];

  if (loading) return <DashboardLoader />;

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col relative">
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            Recruitment Funnel
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Add requisitions and transition candidates through interview stages dynamically.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25">
          <UserPlus className="w-4 h-4 mr-2" /> Add Candidate
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto min-h-0 mt-6 pb-4">
        {stages.map((stageName) => {
          const stageCandidates = candidates.filter(c => c.stage === stageName);
          return (
            <div key={stageName} className="min-w-[300px] w-[300px] flex flex-col bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">{stageName}</h3>
                <span className="bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-2 py-1 rounded-full border border-indigo-500/20">{stageCandidates.length}</span>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[500px]">
                <AnimatePresence>
                  {stageCandidates.map((cand) => (
                    <motion.div
                      key={cand._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 hover:border-indigo-500/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-200 text-sm">{cand.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{cand.role}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <div className="flex gap-1.5">
                          <button
                            disabled={cand.stage === "Applied"}
                            onClick={() => moveStage(cand._id, "prev")}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={cand.stage === "Hired"}
                            onClick={() => moveStage(cand._id, "next")}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeCandidate(cand._id)}
                          className="p-1 rounded bg-slate-900 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {stageCandidates.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                    No active applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">Add Funnel Applicant</h2>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Applicant Name</label>
                  <Input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter full name..."
                    className="bg-black/40 border-white/10 text-sm h-10 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Requisition Target Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                  >
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="AI Research Specialist">AI Research Specialist</option>
                  </select>
                </div>
                <div className="flex gap-2.5 justify-end pt-3">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-white/10 text-white">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-600/90 text-white">
                    Register Applicant
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
