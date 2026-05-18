"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, Calendar, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Brain, Sparkles, SlidersHorizontal, Zap, Info, ArrowRight, ShieldAlert, Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimulatorProps {
  role: 'hr' | 'manager';
  initialData?: any;
}

export function AIWorkforceSimulator({ role, initialData }: SimulatorProps) {
  // Simulator Parameters (Sliders)
  const [workload, setWorkload] = useState(100); // 50% to 200%
  const [deadlineCompression, setDeadlineCompression] = useState(100); // 50% (relaxed) to 150% (aggressive)
  const [teamCapacity, setTeamCapacity] = useState(100); // 50% to 150%
  const [leaveApprovals, setLeaveApprovals] = useState(50); // 0% to 100%

  // AI State
  const [isComputing, setIsComputing] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  // Debounce slider changes to simulate "AI Thinking"
  useEffect(() => {
    setIsComputing(true);
    const timer = setTimeout(() => {
      calculatePredictions();
      setIsComputing(false);
    }, 800); // 800ms thinking time for realism
    return () => clearTimeout(timer);
  }, [workload, deadlineCompression, teamCapacity, leaveApprovals]);

  const calculatePredictions = () => {
    // Engine Logic
    // Base metrics
    const capacityRatio = teamCapacity / 100;
    const effectiveWorkload = (workload / 100) / capacityRatio;
    const stressFactor = effectiveWorkload * (deadlineCompression / 100);
    const restFactor = leaveApprovals / 50; // 1 = normal, >1 = well rested, <1 = fatigued
    
    // Core Predictions
    let burnoutProb = Math.min(99, Math.max(5, (stressFactor * 50) - (restFactor * 15)));
    let productivity = Math.min(120, Math.max(30, (100 * capacityRatio) - (stressFactor > 1.2 ? (stressFactor - 1.2) * 40 : 0) + (restFactor * 5)));
    let delayRisk = Math.min(99, Math.max(2, (effectiveWorkload > 1.1 ? (effectiveWorkload - 1.1) * 60 : 5) + (deadlineCompression > 120 ? 20 : 0)));
    let morale = Math.min(100, Math.max(10, 100 - (burnoutProb * 0.7) + (restFactor * 10)));

    // Chart Data Generation (4 weeks projection)
    const chartData = Array.from({ length: 4 }).map((_, i) => {
       const weekMultiplier = 1 + (i * 0.1);
       // Current state (Baseline 100s)
       const currentProd = Math.max(40, 100 - (i * 2));
       // Simulated state
       let simProd = productivity * (1 - (burnoutProb / 200 * weekMultiplier));
       
       return {
         name: `Week ${i + 1}`,
         current: Math.round(currentProd),
         simulated: Math.round(simProd)
       };
    });

    // Generate Explainable AI reasoning
    const reasons = [];
    if (effectiveWorkload > 1.2) reasons.push("Workload severely exceeds current team capacity.");
    if (deadlineCompression > 110) reasons.push("Aggressive deadlines are artificially inflating stress metrics.");
    if (leaveApprovals < 30) reasons.push("Low leave approval rates indicate restricted recovery time.");
    if (teamCapacity < 90) reasons.push("Reduced headcount is creating single-point-of-failure bottlenecks.");
    if (reasons.length === 0) reasons.push("Current parameters indicate a balanced, sustainable work environment.");

    // Generate Recommendations
    const recommendations = [];
    if (burnoutProb > 65) recommendations.push("Approve pending leave requests to improve recovery factor.");
    if (delayRisk > 60) recommendations.push("Extend upcoming milestone deadlines by 15% or redistribute tasks.");
    if (effectiveWorkload > 1.3) recommendations.push("Temporarily hire contractors or shift non-critical goals to Q3.");
    if (recommendations.length === 0) recommendations.push("Maintain current management velocity.");

    setSimData({
      burnoutProb: Math.round(burnoutProb),
      productivity: Math.round(productivity),
      delayRisk: Math.round(delayRisk),
      morale: Math.round(morale),
      confidence: Math.round(85 + Math.random() * 10), // 85-95%
      chartData,
      reasons,
      recommendations,
      severity: burnoutProb > 75 || delayRisk > 75 ? 'critical' : burnoutProb > 50 || delayRisk > 50 ? 'warning' : 'healthy'
    });
  };

  const getHeatmapColor = (val: number, inverse = false) => {
    const v = inverse ? 100 - val : val;
    if (v < 30) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
    if (v < 65) return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    return 'bg-red-500/20 border-red-500/50 text-red-400';
  };

  const getHeatmapTextColor = (val: number, inverse = false) => {
    const v = inverse ? 100 - val : val;
    if (v < 30) return 'text-emerald-400';
    if (v < 65) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Card className="glass-card border-white/10 bg-[#06060a]/90 text-white shadow-2xl overflow-hidden relative w-full mb-6 mt-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black/0 to-black/0 pointer-events-none" />
      
      {/* Header */}
      <CardHeader className="pb-4 border-b border-white/5 relative z-10 bg-black/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              <Brain className="w-6 h-6 text-indigo-400" /> 
              Decision Intelligence Simulator
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Predict workforce outcomes by adjusting environmental parameters.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <AnimatePresence mode="wait">
               {isComputing ? (
                 <motion.div 
                   key="computing"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30"
                 >
                   <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                   <span className="text-xs font-semibold text-indigo-300 tracking-wider">AI PREDICTING...</span>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="ready"
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
                 >
                   <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                   <span className="text-xs font-semibold text-emerald-300 tracking-wider">LIVE {simData?.confidence}% CONFIDENCE</span>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col xl:flex-row relative z-10">
        {/* Left Column: Sliders */}
        <div className="w-full xl:w-1/3 border-r border-white/5 bg-black/20 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold tracking-wider text-slate-300 uppercase">Environment Parameters</h3>
          </div>

          <div className="space-y-6">
            {/* Slider 1 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-slate-300">Workload Volume</label>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">{workload}%</span>
              </div>
              <input 
                type="range" min="50" max="200" step="5" value={workload} 
                onChange={(e) => setWorkload(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            {/* Slider 2 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-slate-300">Deadline Aggressiveness</label>
                <span className="text-xs font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded">{deadlineCompression}%</span>
              </div>
              <input 
                type="range" min="50" max="150" step="5" value={deadlineCompression} 
                onChange={(e) => setDeadlineCompression(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
            {/* Slider 3 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-slate-300">Team Capacity / Headcount</label>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">{teamCapacity}%</span>
              </div>
              <input 
                type="range" min="50" max="150" step="5" value={teamCapacity} 
                onChange={(e) => setTeamCapacity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            {/* Slider 4 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-slate-300">Leave Approval Rate</label>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">{leaveApprovals}%</span>
              </div>
              <input 
                type="range" min="0" max="100" step="5" value={leaveApprovals} 
                onChange={(e) => setLeaveApprovals(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Predictions */}
        <div className="flex-1 p-6 flex flex-col bg-black/40 relative min-h-[400px]">
           <AnimatePresence>
             {isComputing && (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center"
               >
                 <div className="w-16 h-16 relative flex items-center justify-center">
                    <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-2 border-b-2 border-cyan-400 rounded-full animate-spin-reverse" />
                    <Brain className="w-6 h-6 text-white animate-pulse" />
                 </div>
                 <h3 className="mt-4 text-sm font-bold tracking-widest text-indigo-300 uppercase">Simulating Quantum Outcomes</h3>
               </motion.div>
             )}
           </AnimatePresence>

           {simData && (
             <div className="flex-1 flex flex-col">
                {/* Top Metrics Heatmap */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-colors duration-500 ${getHeatmapColor(simData.burnoutProb)}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Burnout Risk</span>
                    <span className="text-2xl font-black">{simData.burnoutProb}%</span>
                  </div>
                  <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-colors duration-500 ${getHeatmapColor(simData.productivity, true)}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Productivity</span>
                    <span className="text-2xl font-black">{simData.productivity}%</span>
                  </div>
                  <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-colors duration-500 ${getHeatmapColor(simData.delayRisk)}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Delay Risk</span>
                    <span className="text-2xl font-black">{simData.delayRisk}%</span>
                  </div>
                  <div className={`p-4 rounded-xl border flex flex-col gap-1 transition-colors duration-500 ${getHeatmapColor(simData.morale, true)}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Team Morale</span>
                    <span className="text-2xl font-black">{simData.morale}%</span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[250px]">
                  {/* Chart */}
                  <div className="flex-1 border border-white/5 rounded-xl bg-black/20 p-4 relative flex flex-col">
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">4-Week Scenario Comparison</h4>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={simData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} domain={[0, 150]} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#cbd5e1' }}
                          />
                          <ReferenceLine y={100} stroke="#ffffff20" strokeDasharray="3 3" />
                          <Area type="monotone" dataKey="current" name="Current Trajectory" stroke="#64748b" fillOpacity={1} fill="url(#colorCurrent)" />
                          <Area type="monotone" dataKey="simulated" name="Simulated Outcome" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorSim)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Explainable AI Panel */}
                  <div className="w-full lg:w-[350px] flex flex-col gap-4">
                     {/* AI Reasoning */}
                     <div className="flex-1 border border-white/5 rounded-xl bg-black/20 p-4">
                       <div className="flex items-center gap-2 mb-3">
                         <Info className="w-4 h-4 text-indigo-400" />
                         <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300">Why this outcome?</span>
                       </div>
                       <ul className="space-y-2">
                         {simData.reasons.map((r: string, idx: number) => (
                           <li key={idx} className="text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 mt-1.5 shrink-0" />
                             {r}
                           </li>
                         ))}
                       </ul>
                     </div>

                     {/* Actions / Scenarios */}
                     <div className={`p-4 rounded-xl border ${simData.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' : simData.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                       <div className="flex items-center gap-2 mb-3">
                         <Target className={`w-4 h-4 ${simData.severity === 'critical' ? 'text-red-400' : simData.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />
                         <span className={`text-[11px] font-bold tracking-widest uppercase ${simData.severity === 'critical' ? 'text-red-300' : simData.severity === 'warning' ? 'text-amber-300' : 'text-emerald-300'}`}>
                           {simData.severity === 'critical' ? 'High Risk Scenario' : simData.severity === 'warning' ? 'Expected Outcome' : 'Best Case Scenario'}
                         </span>
                       </div>
                       <div className="space-y-2">
                         {simData.recommendations.map((rec: string, idx: number) => (
                           <div key={idx} className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                             <ArrowRight className="w-3.5 h-3.5 text-white/50 mt-0.5 shrink-0" />
                             <span className="text-xs text-white/90 font-medium leading-relaxed">{rec}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                  </div>
                </div>
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
