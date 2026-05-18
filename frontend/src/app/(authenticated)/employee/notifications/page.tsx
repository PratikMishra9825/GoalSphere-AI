"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, AlertTriangle, Clock, CalendarX, MessageSquare, Trash2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAllRead, markOneRead, deleteOne } = useNotifications();

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary animate-pulse" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated on your goals, approvals, and team activity in real-time.</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllRead} 
            variant="outline" 
            className="border-primary/20 hover:bg-primary/10 text-primary w-full sm:w-auto"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4 mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="glass-card border-white/10 bg-black/20 py-12 text-center">
            <CardContent className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Bell className="w-12 h-12 text-white/10" />
              <p className="text-lg font-semibold text-white/60">You&apos;re all caught up!</p>
              <p className="text-sm">New real-time updates and activity notifications will appear here instantly.</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => {
              const typeColors: Record<string, string> = {
                goal_approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/25",
                goal_rejected: "bg-red-500/20 text-red-400 border-red-500/25",
                goal_created: "bg-blue-500/20 text-blue-400 border-blue-500/25",
                goal_submitted: "bg-amber-500/20 text-amber-400 border-amber-500/25",
                goal_updated: "bg-violet-500/20 text-violet-400 border-violet-500/25",
                system: "bg-slate-700/50 text-slate-400 border-slate-700/60",
              };
              const typeIcons: Record<string, React.ReactComponentElement<any>> = {
                goal_approved: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />,
                goal_rejected: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />,
                goal_created: <CalendarX className="w-5 h-5 sm:w-6 sm:h-6" />,
                goal_submitted: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
                goal_updated: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
                system: <Bell className="w-5 h-5 sm:w-6 sm:h-6" />,
              };
              const colorClass = typeColors[n.type] || typeColors.system;
              const icon = typeIcons[n.type] || typeIcons.system;

              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`glass-card border-white/10 transition-all hover:bg-white/[0.04] cursor-pointer group relative overflow-hidden ${
                      !n.read ? "bg-white/[0.03] border-primary/20 shadow-md" : "bg-black/20"
                    }`}
                    onClick={() => markOneRead(n._id)}
                  >
                    <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                      <div className={`shrink-0 rounded-2xl p-2.5 sm:p-3 border ${colorClass}`}>
                        {icon}
                      </div>
                      
                      <div className="flex-1 space-y-1 min-w-0 pr-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                          <h4 className={`text-base sm:text-lg font-semibold truncate ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed pr-2">
                          {n.message}
                        </p>
                      </div>

                      {/* Read status indicator */}
                      {!n.read && (
                        <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-2.5 sm:mt-3.5 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOne(n._id);
                        }}
                        className="absolute right-4 bottom-4 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-400 cursor-pointer flex items-center justify-center"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
