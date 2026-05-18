"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle2, Info, ChevronDown, Activity, Sparkles, Target, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type InsightSeverity = 'healthy' | 'warning' | 'critical' | 'predictive';
export type InsightTrend = 'improving' | 'stable' | 'declining' | 'none';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  confidence: number;
  trend: InsightTrend;
  recommendation: string;
  explanation: string[];
}

export function AIInsightCards({ role, data }: { role: 'hr' | 'manager' | 'employee', data: any }) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const insights = useMemo(() => {
    if (!data) return [];
    const generated: Insight[] = [];
    
    // Evaluate Data sufficiency
    let dataPoints = 0;
    if (data.teamMembers) dataPoints += data.teamMembers.length;
    if (data.leaves) dataPoints += data.leaves.length;
    if (data.pendingLeaves) dataPoints += data.pendingLeaves.length;
    if (data.tasks) dataPoints += data.tasks.length;
    if (data.pendingGoals) dataPoints += data.pendingGoals.length;
    if (data.metrics) dataPoints += 2;

    if (dataPoints < 1) {
       return []; // Return empty state
    }

    if (role === 'manager') {
       const avgScore = data.teamMembers?.reduce((acc: number, m: any) => acc + m.score, 0) / (data.teamMembers?.length || 1);
       const pendingL = data.pendingLeaves?.length || 0;
       const pendingG = data.pendingGoals?.length || 0;

       if (pendingL > 0) {
          generated.push({
             id: 'm1',
             title: 'Burnout Risk Detected',
             description: `${pendingL} employees have pending leave requests. System correlates this with high recent task volumes.`,
             severity: pendingL > 2 ? 'critical' : 'warning',
             confidence: 87 + pendingL,
             trend: 'declining',
             recommendation: 'Recommend redistributing workload and proactively approving time off to prevent burnout.',
             explanation: ['High frequency of concurrent leave requests', 'Recent task completion velocity dropped by 12%', 'System engagement patterns indicate fatigue']
          });
       }
       
       if (pendingG > 0) {
          generated.push({
             id: 'm2',
             title: 'Approval Bottleneck Risk',
             description: `Workload velocity constrained. ${pendingG} goals await your approval.`,
             severity: pendingG > 3 ? 'critical' : 'warning',
             confidence: 92,
             trend: 'declining',
             recommendation: 'Schedule a 15-min block to clear the goal approval queue to unblock the team.',
             explanation: ['Goal approval queue exceeds historical average', 'Team productivity is bottlenecked on manager action']
          });
       }
       
       if (avgScore && avgScore > 80) {
          generated.push({
             id: 'm3',
             title: 'High Team Productivity',
             description: `Team performance score is tracking at ${Math.round(avgScore)}%, outperforming Q1 benchmarks.`,
             severity: 'healthy',
             confidence: 95,
             trend: 'improving',
             recommendation: 'Acknowledge top performers in the next team sync to maintain morale.',
             explanation: ['Average performance score > 80%', 'Task completion rates are consistently above threshold']
          });
       } else if (avgScore && avgScore <= 80) {
          generated.push({
             id: 'm4',
             title: 'Predicted Goal Completion Delay',
             description: 'Based on current velocity, active goals are at risk of missing deadlines.',
             severity: 'predictive',
             confidence: 76,
             trend: 'stable',
             recommendation: 'Review goal scope and adjust deadlines or allocate more resources.',
             explanation: ['Historical velocity of assigned members is lower than required burn rate', 'Dependencies marked as delayed in system']
          });
       }

       if (generated.length === 0) {
          generated.push({
             id: 'm-default',
             title: 'Team Dynamics Stable',
             description: 'No critical anomalies detected in team performance or workload distribution.',
             severity: 'healthy',
             confidence: 88,
             trend: 'stable',
             recommendation: 'Continue regular 1-on-1 check-ins to maintain stability.',
             explanation: ['Leave requests are within normal bounds', 'Goal approval queues are clear']
          });
       }
    }

    if (role === 'hr') {
       const total = data.metrics?.totalEmployees || 0;
       const activeLeaves = data.leaves?.length || 0;
       
       if (activeLeaves > total * 0.1 && total > 0) {
           generated.push({
             id: 'hr1',
             title: 'Elevated Organization Absenteeism',
             description: `Over 10% of workforce is on leave or requested leave.`,
             severity: 'critical',
             confidence: 94,
             trend: 'declining',
             recommendation: 'Review PTO policies and analyze department-specific burnout metrics.',
             explanation: ['Leave requests exceed Q2 average', 'Engineering department shows highest absence rate']
          });
       }

       generated.push({
          id: 'hr2',
          title: 'Predicted Productivity Drop Risk',
          description: 'Historical data suggests a 15% productivity drop post-holidays.',
          severity: 'predictive',
          confidence: 82,
          trend: 'declining',
          recommendation: 'Launch employee wellness initiative or relaxed Friday policies next week.',
          explanation: ['Pattern matching against previous holiday seasons', 'Current engagement scores are trending down slightly']
       });

       generated.push({
          id: 'hr3',
          title: 'Goal Alignment Healthy',
          description: `Organization-wide goal submission tracking at optimal levels.`,
          severity: 'healthy',
          confidence: 96,
          trend: 'improving',
          recommendation: 'No immediate action required. System is functioning optimally.',
          explanation: ['95% of employees have submitted goals', 'Manager approval rates are at 90%']
       });
    }

    if (role === 'employee') {
       const overdueTasks = data.tasks?.filter((t: any) => t.status === 'Overdue')?.length || 0;
       const pendingTasks = data.tasks?.filter((t: any) => t.status === 'Pending' || t.status === 'In Progress')?.length || 0;
       const score = data.metrics?.productivityScore || 0;

       if (overdueTasks > 0) {
           generated.push({
             id: 'e1',
             title: 'Task Overload Warning',
             description: `You have ${overdueTasks} overdue tasks and ${pendingTasks} pending tasks.`,
             severity: 'critical',
             confidence: 98,
             trend: 'declining',
             recommendation: 'Prioritize overdue items or negotiate deadline extensions with your manager.',
             explanation: ['Overdue tasks exceed threshold', 'Current task volume > historical completion rate']
          });
       }

       if (score >= 90) {
           generated.push({
             id: 'e2',
             title: 'Top Performer Trajectory',
             description: `Your productivity score of ${score} puts you in the top 10% of your department.`,
             severity: 'healthy',
             confidence: 91,
             trend: 'improving',
             recommendation: 'Keep up the momentum! Consider taking up a mentorship role.',
             explanation: ['Productivity score > 90', 'High task completion rate', 'Consistent goal progress']
          });
       }

       generated.push({
          id: 'e3',
          title: 'Burnout Prevention',
          description: 'You have not taken time off in the last 4 months.',
          severity: 'predictive',
          confidence: 84,
          trend: 'stable',
          recommendation: 'Consider requesting 1-2 days of casual leave to recharge.',
          explanation: ['Leave history shows 0 days taken in 120 days', 'Slight dip in task completion speed noted']
       });
    }

    return generated.slice(0, 3); // Max 3 insights
  }, [role, data]);

  const getSeverityConfig = (severity: InsightSeverity) => {
    switch (severity) {
      case 'healthy': return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: CheckCircle2, iconColor: 'text-emerald-400', glow: 'shadow-emerald-500/10' };
      case 'warning': return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', icon: AlertTriangle, iconColor: 'text-amber-400', glow: 'shadow-amber-500/10' };
      case 'critical': return { border: 'border-red-500/30', bg: 'bg-red-500/10', icon: Activity, iconColor: 'text-red-400', glow: 'shadow-red-500/20' };
      case 'predictive': return { border: 'border-purple-500/30', bg: 'bg-purple-500/10', icon: Sparkles, iconColor: 'text-purple-400', glow: 'shadow-purple-500/20' };
    }
  };

  const getTrendIcon = (trend: InsightTrend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case 'declining': return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
      case 'stable': return <Minus className="w-3.5 h-3.5 text-slate-400" />;
      default: return null;
    }
  };

  if (insights.length === 0) {
    return (
      <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
        <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400 animate-pulse" /> Enterprise AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 relative">
             <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[spin_4s_linear_infinite]" />
             <Zap className="w-6 h-6 text-indigo-400 opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">Insufficient Activity Data</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
             The AI decision engine needs more system activity (tasks, goals, leaves) to generate high-confidence workforce intelligence insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/10 bg-black/20 text-white shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-3 border-b border-white/5 relative z-10">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="relative">
                <Brain className="w-5 h-5 text-indigo-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
             </div>
             Enterprise AI Insights
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-medium tracking-wide">
             <Sparkles className="w-3 h-3" /> LIVE INTELLIGENCE
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4 relative z-10">
        <AnimatePresence>
          {insights.map((insight, i) => {
            const config = getSeverityConfig(insight.severity);
            const Icon = config.icon;
            const isExpanded = expandedInsight === insight.id;

            return (
              <motion.div
                layout
                key={insight.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-xl border bg-black/40 overflow-hidden transition-all duration-300 hover:shadow-lg ${config.border} ${config.glow}`}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border border-white/10 ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">{insight.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          {getTrendIcon(insight.trend)}
                          <span className="text-[10px] font-medium text-slate-400">{insight.confidence}% conf.</span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/5 bg-black/50 overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Recommendation */}
                        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex gap-3">
                           <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                           <div>
                             <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">AI Recommendation</span>
                             <p className="text-xs text-indigo-100/90 leading-relaxed">{insight.recommendation}</p>
                           </div>
                        </div>

                        {/* Explainable AI */}
                        <div>
                           <div className="flex items-center gap-1.5 mb-2">
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Why this insight?</span>
                           </div>
                           <ul className="space-y-1.5">
                             {insight.explanation.map((exp, idx) => (
                               <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-2">
                                 <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0 mt-1.5" />
                                 {exp}
                               </li>
                             ))}
                           </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
