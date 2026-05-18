"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, RefreshCcw, Download, TrendingUp, AlertTriangle,
  CheckCircle2, Brain, Calendar, Clock, ChevronRight, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WeeklyMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  pendingTasks: number;
  leavesRequested: number;
  goalsActive: number;
  goalsApproved: number;
  engagementScore: number;
}

interface WeeklyReport {
  _id: string;
  role: string;
  weekStart: string;
  weekEnd: string;
  summaryText: string;
  metrics: WeeklyMetrics;
  burnoutRisk: 'Low' | 'Medium' | 'High';
  productivityDelta: string;
  createdAt: string;
}

interface WeeklyIntelligenceCardProps {
  role: 'employee' | 'manager' | 'hr';
}

const RISK_STYLES = {
  Low:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2 },
  Medium: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   icon: AlertTriangle },
  High:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     icon: AlertTriangle },
};

const ROLE_LABELS: Record<string, string> = {
  employee: 'Personal Performance',
  manager:  'Team Analytics',
  hr:       'Workforce Overview',
};

export function WeeklyIntelligenceCard({ role }: WeeklyIntelligenceCardProps) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pulse' | 'metrics' | 'guidance'>('pulse');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/weekly-summary', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching weekly report:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    toast.info('Generating your AI Intelligence Summary…');
    try {
      const res = await fetch('http://localhost:5000/api/ai/weekly-summary/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        toast.success('Weekly Intelligence Summary generated!');
      } else {
        toast.error('Failed to generate summary. Please retry.');
      }
    } catch (err) {
      toast.error('AI engine connection error.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    toast.info('Compiling your enterprise PDF report…');
    try {
      const res = await fetch('http://localhost:5000/api/ai/export-pdf', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) {
        const rawBlob = await res.blob();
        const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `GoalSphere_${role}_report.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Removed URL.revokeObjectURL to ensure 100% compatibility across all download managers
        
        toast.success('PDF report downloaded successfully!');
      } else {
        toast.error('PDF generation failed. Please retry.');
      }
    } catch (err) {
      toast.error('Could not connect to PDF engine.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Parse the three-paragraph summary into tab sections
  const paragraphs = report?.summaryText?.split('\n\n').filter(Boolean) || [];
  const tabParagraph = { pulse: paragraphs[0], metrics: paragraphs[1], guidance: paragraphs[2] };

  const riskStyle = RISK_STYLES[report?.burnoutRisk || 'Low'];
  const RiskIcon = riskStyle.icon;

  const weekLabel = report
    ? `${new Date(report.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(report.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Current Week';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f1a] shadow-2xl">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Hero Header */}
      <div className="relative border-b border-white/5 bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-500/40">
              <Brain className="h-5 w-5 text-violet-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Weekly Intelligence Summary
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
                  <Sparkles className="h-2.5 w-2.5" /> AI-Generated
                </span>
              </h2>
              <p className="text-xs text-white/40 mt-0.5">{ROLE_LABELS[role]} · {weekLabel}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={generateReport}
              disabled={generating}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5"
            >
              <RefreshCcw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating…' : 'Regenerate'}
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={downloading}
              size="sm"
              className="h-8 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-lg shadow-violet-900/30"
            >
              <Download className={`h-3 w-3 ${downloading ? 'animate-bounce' : ''}`} />
              {downloading ? 'Compiling…' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-white/30">
            <RefreshCcw className="h-7 w-7 text-violet-400 animate-spin" />
            <p className="text-xs animate-pulse">Loading intelligence summary…</p>
          </div>
        ) : !report ? (
          // Empty state — prompt to generate
          <div className="flex flex-col items-center justify-center py-14 gap-4 text-white/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
              <Sparkles className="h-7 w-7 text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/60">No summary available yet</p>
              <p className="text-xs text-white/30 mt-1">Your weekly intelligence report will appear here.</p>
            </div>
            <Button
              onClick={generateReport}
              disabled={generating}
              size="sm"
              className="h-9 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? 'Generating…' : 'Generate AI Summary Now'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* KPI bar */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Completion Rate', value: `${report.metrics.completionRate}%`, icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'Tasks Done', value: `${report.metrics.completedTasks}/${report.metrics.totalTasks}`, icon: CheckCircle2, color: 'text-sky-400' },
                { label: 'Engagement', value: `${report.metrics.engagementScore}%`, icon: Activity, color: 'text-violet-400' },
                { label: 'Pending Tasks', value: String(report.metrics.pendingTasks), icon: Clock, color: report.metrics.pendingTasks > 5 ? 'text-red-400' : 'text-amber-400' },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
                    <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
                    {kpi.label}
                  </div>
                  <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Burnout risk badge */}
            <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${riskStyle.bg} ${riskStyle.border}`}>
              <RiskIcon className={`h-4 w-4 shrink-0 ${riskStyle.text}`} />
              <span className="text-xs text-white/70">
                Burnout Risk Assessment: <span className={`font-bold ${riskStyle.text}`}>{report.burnoutRisk} Risk</span>
                {report.burnoutRisk === 'High' && ' — Immediate workload review recommended'}
                {report.burnoutRisk === 'Medium' && ' — Monitor workload cadence this week'}
                {report.burnoutRisk === 'Low' && ' — Engagement levels are healthy'}
              </span>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
              {(['pulse', 'metrics', 'guidance'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold capitalize tracking-wide transition-all ${
                    activeTab === tab
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-900/30'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab === 'pulse' ? '🚀 Performance Pulse' : tab === 'metrics' ? '⚠️ Wellbeing Signal' : '💡 Strategic Guidance'}
                </button>
              ))}
            </div>

            {/* AI Narrative Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="min-h-[80px] rounded-xl border border-white/5 bg-white/[0.015] px-4 py-3"
              >
                {tabParagraph[activeTab] ? (
                  <p className="text-xs leading-relaxed text-white/65">
                    {tabParagraph[activeTab]}
                  </p>
                ) : (
                  <p className="text-xs text-white/30 italic">Regenerate summary to view this section.</p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-white/25">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Week ending {new Date(report.weekEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-violet-500" /> Powered by Gemini 2.5 Flash</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
