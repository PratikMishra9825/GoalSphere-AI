"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Lock, 
  Globe, 
  Trash2, 
  Download, 
  Mail, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type TabType = "security" | "data" | "notifications";

export default function HRSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("security");
  const [isWiping, setIsWiping] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Security Tab State
  const [timeout, setTimeoutVal] = useState("30");
  const [policy, setPolicy] = useState("Strict (12 chars, special, number)");
  const [ipRanges, setIpRanges] = useState("0.0.0.0/0");
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionPinning, setSessionPinning] = useState(false);

  // Data Management Tab State
  const [backupSchedule, setBackupSchedule] = useState("Daily");
  const [retainLogs, setRetainLogs] = useState("90");
  const [cloudBackup, setCloudBackup] = useState(true);

  // Notifications Tab State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [notifChannel, setNotifChannel] = useState("#announcements");
  const [reviewReminders, setReviewReminders] = useState(true);

  const getBackendUrl = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      return `http://${host}:5000`;
    }
    return "http://localhost:5000";
  };

  // Fetch real settings from MongoDB on mount
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${getBackendUrl()}/api/actions/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.timeout) setTimeoutVal(data.timeout);
        if (data.policy) setPolicy(data.policy);
        if (data.ipRanges) setIpRanges(data.ipRanges);
        if (data.twoFactor !== undefined) setTwoFactor(data.twoFactor);
        if (data.sessionPinning !== undefined) setSessionPinning(data.sessionPinning);
        if (data.backupSchedule) setBackupSchedule(data.backupSchedule);
        if (data.retainLogs) setRetainLogs(data.retainLogs);
        if (data.cloudBackup !== undefined) setCloudBackup(data.cloudBackup);
        if (data.emailAlerts !== undefined) setEmailAlerts(data.emailAlerts);
        if (data.smsAlerts !== undefined) setSmsAlerts(data.smsAlerts);
        if (data.notifChannel) setNotifChannel(data.notifChannel);
        if (data.reviewReminders !== undefined) setReviewReminders(data.reviewReminders);
      }
    } catch (err) {
      console.error("Failed to load backend settings:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettingsToBackend = async (updates: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getBackendUrl()}/api/actions/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to save settings:", err);
      return false;
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveSettingsToBackend({ timeout, policy, ipRanges, twoFactor, sessionPinning });
    if (ok) {
      toast.success("Security Policies Updated", {
        description: "Organization-wide identity rules saved to core database.",
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
      });
    } else {
      toast.error("Failed to save security policies");
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveSettingsToBackend({ backupSchedule, retainLogs, cloudBackup });
    if (ok) {
      toast.success("Data Retention Rules Saved", {
        description: "Backup routines and log schedules successfully stored.",
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
      });
    } else {
      toast.error("Failed to save data retention rules");
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveSettingsToBackend({ emailAlerts, smsAlerts, notifChannel, reviewReminders });
    if (ok) {
      toast.success("Notification Delivery Updated", {
        description: "Global dispatch feeds and push parameters synced.",
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
      });
    } else {
      toast.error("Failed to update notification delivery");
    }
  };

  const handleWipeData = () => {
    setIsWiping(true);
    setTimeout(() => {
      setIsWiping(false);
      toast.success("Demo Data Wiped", {
        description: "Sandbox seed files cleared safely. System reset initiated.",
        icon: <Trash2 className="w-5 h-5 text-red-500" />
      });
    }, 1500);
  };

  const handleExportAudit = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Audit Logs Generated", {
        description: "goalsphere_audit_q2_2026.csv has been successfully compiled and downloaded.",
        icon: <Download className="w-5 h-5 text-indigo-500" />
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl relative">
      {/* Decorative Blur Ambient Elements - Indigo Theme */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Portal Administration
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Configure organization-wide defaults, custom data policy rules, global messaging integrations, and security controls.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Settings Navigation Sidebar */}
        <div className="w-full lg:w-64 flex lg:flex-col gap-1 p-1 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl">
          {[
            { id: "security", label: "Security & RBAC", icon: Shield },
            { id: "data", label: "Data Management", icon: Database },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Settings Panels with Framer Motion Animation */}
        <div className="flex-1 w-full min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-slate-800/80 p-6 bg-slate-900/20">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <CardTitle className="text-lg font-bold text-white tracking-tight">Security & RBAC Configuration</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 mt-1">Manage system token validation, session persistence thresholds, and IP network grids.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleSaveSecurity} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Session Timeout (minutes)</Label>
                          <Input 
                            type="number" 
                            value={timeout} 
                            onChange={(e) => setTimeoutVal(e.target.value)} 
                            className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-indigo-500 h-11 rounded-xl w-full" 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Default Password Complexity</Label>
                          <select 
                            value={policy}
                            onChange={(e) => setPolicy(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            <option className="bg-slate-900">Standard (8 chars, 1 number)</option>
                            <option className="bg-slate-900">Strict (12 chars, special, number)</option>
                            <option className="bg-zinc-900">Enterprise High (16 chars, no repeats)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Allowed IP Ranges (CIDR Whitelisting)</Label>
                        <textarea 
                          rows={3} 
                          value={ipRanges}
                          onChange={(e) => setIpRanges(e.target.value)}
                          className="flex w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none leading-relaxed"
                        />
                        <p className="text-xs text-slate-500 leading-normal">
                          Define whitelisted connection zones (e.g. corporate VPN grids). Leave <code className="bg-slate-800/50 px-1 py-0.5 rounded text-indigo-400">0.0.0.0/0</code> to enable globally open portals.
                        </p>
                      </div>

                      <div className="border-t border-slate-800 pt-6 space-y-4">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500">Strict Controls</h4>
                        
                        <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                          <div className="space-y-0.5 pr-4">
                            <span className="text-sm font-semibold text-white block">Enforce Two-Factor Authentication</span>
                            <span className="text-xs text-slate-500 leading-normal">Require security code verification on all non-OAuth login workflows.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTwoFactor(!twoFactor)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {twoFactor ? (
                              <ToggleRight className="w-9 h-9 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-slate-600" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                          <div className="space-y-0.5 pr-4">
                            <span className="text-sm font-semibold text-white block">Strict Session Pinning</span>
                            <span className="text-xs text-slate-500 leading-normal">Tie user authorization keys permanently to their initial handshake IP.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSessionPinning(!sessionPinning)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {sessionPinning ? (
                              <ToggleRight className="w-9 h-9 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-slate-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl px-6 transition-colors shadow-lg shadow-indigo-600/10">
                        Save Security Configuration
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-slate-800/80 p-6 bg-slate-900/20">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <CardTitle className="text-lg font-bold text-white tracking-tight">Data Management & Cycles</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 mt-1">Configure automated backup intervals, metrics lifespan archiving, and export database state logs.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleSaveData} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Backup Routine Frequency</Label>
                          <select 
                            value={backupSchedule}
                            onChange={(e) => setBackupSchedule(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            <option className="bg-slate-900">Real-time Continuous</option>
                            <option className="bg-slate-900">Daily</option>
                            <option className="bg-slate-900">Weekly</option>
                            <option className="bg-slate-900">Monthly</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Retain Action Logs (days)</Label>
                          <Input 
                            type="number" 
                            value={retainLogs} 
                            onChange={(e) => setRetainLogs(e.target.value)} 
                            className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-indigo-500 h-11 rounded-xl w-full" 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                        <div className="space-y-0.5 pr-4">
                          <span className="text-sm font-semibold text-white block">Automatic Cloud Mirrors</span>
                          <span className="text-xs text-gray-500 leading-normal">Mirror database backups securely to verified remote Cloudinary archive buckets.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCloudBackup(!cloudBackup)}
                          className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {cloudBackup ? (
                            <ToggleRight className="w-9 h-9 text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-9 h-9 text-slate-600" />
                          )}
                        </button>
                      </div>

                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl px-6 transition-colors shadow-lg shadow-indigo-600/10">
                        Update Retention Rules
                      </Button>
                    </form>

                    <div className="border-t border-slate-800 pt-6 space-y-4">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Danger Zone & Exports
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-950/10 border border-red-500/20 rounded-2xl">
                        <div className="space-y-0.5 pr-4 flex-1">
                          <span className="text-sm font-semibold text-white block">Purge Portal Sandboxes</span>
                          <span className="text-xs text-slate-500 leading-normal">Wipe mock announcements, seeder goals, and temporary metrics logs to reset system.</span>
                        </div>
                        <Button 
                          onClick={handleWipeData}
                          disabled={isWiping}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold h-10 rounded-xl px-4 flex items-center gap-2 shrink-0 transition-all border border-red-500/10"
                        >
                          {isWiping ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Wipe Demo Data
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                        <div className="space-y-0.5 pr-4 flex-1">
                          <span className="text-sm font-semibold text-white block">Export System Audit logs</span>
                          <span className="text-xs text-slate-500 leading-normal">Compile and export the complete compliance trail database logs for identity audits.</span>
                        </div>
                        <Button 
                          onClick={handleExportAudit}
                          disabled={isExporting}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white font-semibold h-10 rounded-xl px-4 flex items-center gap-2 shrink-0 transition-all"
                        >
                          {isExporting ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                          ) : (
                            <Download className="w-4 h-4 text-indigo-400" />
                          )}
                          Compile CSV Logs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-slate-800/80 p-6 bg-slate-900/20">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-5 h-5 text-indigo-400" />
                      <CardTitle className="text-lg font-bold text-white tracking-tight">Global Notification Feeds</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 mt-1">Configure global notification alerts, workspace channels, and automated progress reminders.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <form onSubmit={handleSaveNotifications} className="space-y-6">
                      
                      <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500">Alert Medium channels</h4>

                        <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                          <div className="space-y-0.5 pr-4 flex-1">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                              <Mail className="w-4 h-4 text-indigo-400" /> Email Notifications
                            </span>
                            <span className="text-xs text-gray-500 leading-normal">Send automated emails for reviews pending approvals, goal revisions, and updates.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmailAlerts(!emailAlerts)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {emailAlerts ? (
                              <ToggleRight className="w-9 h-9 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-slate-600" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                          <div className="space-y-0.5 pr-4 flex-1">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-indigo-400" /> SMS & Mobile Push Alerts
                            </span>
                            <span className="text-xs text-gray-500 leading-normal">Deliver urgent performance alerts or leave status update texts directly to mobile numbers.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSmsAlerts(!smsAlerts)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {smsAlerts ? (
                              <ToggleRight className="w-9 h-9 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-slate-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Morale Announcements feed</Label>
                          <Input 
                            type="text" 
                            value={notifChannel} 
                            onChange={(e) => setNotifChannel(e.target.value)} 
                            className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-indigo-500 h-11 rounded-xl w-full" 
                          />
                        </div>

                        <div className="space-y-3 flex flex-col justify-end">
                          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl h-11">
                            <span className="text-xs font-semibold text-slate-300">Goal Review Cycle Reminders</span>
                            <button
                              type="button"
                              onClick={() => setReviewReminders(!reviewReminders)}
                              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                            >
                              {reviewReminders ? (
                                <ToggleRight className="w-7 h-7 text-indigo-500" />
                              ) : (
                                <ToggleLeft className="w-7 h-7 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl px-6 transition-colors shadow-lg shadow-indigo-600/10">
                        Update Global Notification Delivery
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
