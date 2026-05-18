"use client";

import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

interface OnlineBadgeProps {
  userId: string;
  className?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md";
}

/**
 * A small coloured dot that shows green when the user is online
 * and grey when offline. Reads from the global SocketContext.
 */
export function OnlineBadge({ userId, className, size = "sm" }: OnlineBadgeProps) {
  const { isUserOnline } = useSocket();
  const online = isUserOnline(userId);

  const sizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2.5 h-2.5",
    md: "w-3.5 h-3.5",
  };

  return (
    <span
      className={cn(
        "rounded-full border-2 border-background shrink-0 transition-colors duration-500",
        online ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-600",
        sizeClasses[size],
        className
      )}
      title={online ? "Online" : "Offline"}
    />
  );
}
