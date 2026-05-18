"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketEvent } from "@/hooks/useSocket";
import { Target, CheckCircle2, XCircle, RefreshCcw, Bell, User } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  actor?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  goal_created: <Target className="w-3.5 h-3.5 text-blue-400" />,
  goal_approved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  goal_rejected: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  goal_submitted: <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />,
  goal_updated: <RefreshCcw className="w-3.5 h-3.5 text-violet-400" />,
  profile_updated: <User className="w-3.5 h-3.5 text-cyan-400" />,
  system: <Bell className="w-3.5 h-3.5 text-slate-400" />,
  task_created: <Target className="w-3.5 h-3.5 text-sky-400" />,
  task_completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  leave_created: <Bell className="w-3.5 h-3.5 text-orange-400" />,
  leave_updated: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />,
  announcement_new: <Bell className="w-3.5 h-3.5 text-yellow-400" />,
};

const COLOR_MAP: Record<string, string> = {
  goal_created: "border-blue-500/30 bg-blue-500/5",
  goal_approved: "border-emerald-500/30 bg-emerald-500/5",
  goal_rejected: "border-red-500/30 bg-red-500/5",
  goal_submitted: "border-amber-500/30 bg-amber-500/5",
  goal_updated: "border-violet-500/30 bg-violet-500/5",
  profile_updated: "border-cyan-500/30 bg-cyan-500/5",
  system: "border-slate-700 bg-slate-800/30",
  task_created: "border-sky-500/30 bg-sky-500/5",
  task_completed: "border-emerald-500/30 bg-emerald-500/5",
  leave_created: "border-orange-500/30 bg-orange-500/5",
  leave_updated: "border-indigo-500/30 bg-indigo-500/5",
  announcement_new: "border-yellow-500/30 bg-yellow-500/5",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface LiveActivityFeedProps {
  maxItems?: number;
  className?: string;
  initialItems?: ActivityItem[];
}

export function LiveActivityFeed({
  maxItems = 12,
  className = "",
  initialItems = [],
}: LiveActivityFeedProps) {
  // Use professional default seed activities so the timeline is never empty
  const [items, setItems] = useState<ActivityItem[]>(() => {
    let role: string | null = null;
    let name: string | null = null;
    if (typeof window !== "undefined") {
      role = localStorage.getItem("role");
      name = localStorage.getItem("userName");
    }

    const allSeed = [
      {
        id: "seed-1",
        type: "goal_approved",
        message: "Sarah Jenkins's Q2 Leadership Goals were approved by HR Admin",
        timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
      },
      {
        id: "seed-2",
        type: "task_created",
        message: "Michael Scott assigned task: 'Q2 Performance Sync Preparation' to Sarah Jenkins",
        timestamp: new Date(Date.now() - 1000 * 60 * 35), // 35 mins ago
      },
      {
        id: "seed-3",
        type: "announcement_new",
        message: "📢 Global Announcement: Q2 Performance Cycle check-in guidelines are now active.",
        timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      },
      {
        id: "seed-4",
        type: "leave_created",
        message: "Elena Rodriguez submitted a Sick Leave Request for tomorrow",
        timestamp: new Date(Date.now() - 1000 * 60 * 150), // 2.5 hours ago
      },
      {
        id: "seed-5",
        type: "task_completed",
        message: "Marcus Johnson marked task 'Database Query Optimization' as completed",
        timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
      }
    ];

    if (initialItems && initialItems.length > 0) return initialItems;

    // Filter default seed activities on mount for regular employees
    if (role === "employee") {
      return allSeed.filter((item) => {
        const msg = item.message;
        if (msg.startsWith("📢") || msg.includes("is now online") || msg.includes("connected") || msg.includes("engine loaded")) {
          return true;
        }
        if (name && msg.toLowerCase().includes(name.toLowerCase())) {
          return true;
        }
        return false;
      });
    }

    return allSeed;
  });

  const [, tick] = useState(0);

  // Tick every minute to refresh "time ago" labels
  useEffect(() => {
    const interval = setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const addItem = (item: Omit<ActivityItem, "id" | "timestamp">) => {
    let role: string | null = null;
    let name: string | null = null;
    if (typeof window !== "undefined") {
      role = localStorage.getItem("role");
      name = localStorage.getItem("userName");
    }

    // Filter incoming real-time socket events for regular employees to protect data privacy
    if (role === "employee") {
      const msg = item.message;
      const isVisible = 
        msg.startsWith("📢") || 
        msg.includes("is now online") || 
        msg.includes("connected") || 
        msg.includes("engine loaded") ||
        (name && msg.toLowerCase().includes(name.toLowerCase()));
      
      if (!isVisible) return; // Skip additions that belong to other employees
    }

    const newItem: ActivityItem = {
      ...item,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date(),
    };
    setItems((prev) => [newItem, ...prev].slice(0, maxItems));
  };

  // ── Socket subscriptions ──────────────────────────────────────────────────
  useSocketEvent<{ title: string; owner?: { name: string } }>("goal:created", (data) => {
    addItem({
      type: "goal_created",
      message: `${data.owner?.name || "Someone"} created a new goal: "${data.title}"`,
      actor: data.owner?.name,
    });
  });

  useSocketEvent<{ title: string; status: string }>("goal:updated", (data) => {
    addItem({
      type: "goal_updated",
      message: `Goal "${data.title}" was updated (${data.status})`,
    });
  });

  useSocketEvent<{ title: string; status: string }>("goal:status_changed", (data) => {
    addItem({
      type: data.status === "Approved" ? "goal_approved" : "goal_rejected",
      message: `Goal "${data.title}" was ${data.status.toLowerCase()}`,
    });
  });

  useSocketEvent<{ name: string }>("user:online", (data) => {
    addItem({
      type: "profile_updated",
      message: `${data.name} is now online`,
      actor: data.name,
    });
  });

  useSocketEvent<{ title: string; assignedBy?: { name: string } }>("task:created", (data) => {
    addItem({
      type: "task_created",
      message: `New task assigned: "${data.title}" by ${data.assignedBy?.name || "Manager"}`,
    });
  });

  useSocketEvent<{ title: string; assignedTo?: { name: string } }>("task:completed", (data) => {
    addItem({
      type: "task_completed",
      message: `Task completed: "${data.title}" by ${data.assignedTo?.name || "Employee"}`,
    });
  });

  useSocketEvent<{ type: string; user?: { name: string } }>("leave:created", (data) => {
    addItem({
      type: "leave_created",
      message: `New leave request submitted: "${data.type}" by ${data.user?.name || "Employee"}`,
    });
  });

  useSocketEvent<{ type: string; status: string; user?: { name: string } }>("leave:updated", (data) => {
    addItem({
      type: "leave_updated",
      message: `Leave request for "${data.type}" has been ${data.status.toLowerCase()} for ${data.user?.name || "Employee"}`,
    });
  });

  useSocketEvent<{ title: string; createdBy?: { name: string } }>("announcement:new", (data) => {
    addItem({
      type: "announcement_new",
      message: `📢 Global Announcement: "${data.title}" broadcasted by ${data.createdBy?.name || "HR Director"}`,
    });
  });

  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 gap-2 text-white/20 ${className}`}>
        <Bell className="w-5 h-5" />
        <p className="text-xs">No activity yet. Actions will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs ${
              COLOR_MAP[item.type] || COLOR_MAP.system
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {ICON_MAP[item.type] || ICON_MAP.system}
            </div>
            <p className="flex-1 text-white/70 leading-relaxed">{item.message}</p>
            <span className="shrink-0 text-white/25 text-[10px] mt-0.5 whitespace-nowrap">
              {timeAgo(item.timestamp)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
