"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnlineUser {
  userId: string;
  name: string;
  avatar: string;
  role: string;
}

export interface LiveNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Map<string, OnlineUser>;
  isUserOnline: (userId: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  onlineUsers: new Map(),
  isUserOnline: () => false,
});

export function useSocketContext() {
  return useContext(SocketContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [token, setToken] = useState<string | null>(null);

  // Read the token dynamically on mount, and listen for authChanged/storage events
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));

      const handleAuthChange = () => {
        setToken(localStorage.getItem("token"));
      };

      window.addEventListener("authChanged", handleAuthChange);
      window.addEventListener("storage", handleAuthChange);

      return () => {
        window.removeEventListener("authChanged", handleAuthChange);
        window.removeEventListener("storage", handleAuthChange);
      };
    }
  }, []);

  useEffect(() => {
    if (!token) {
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = connectSocket(token);
    setSocket(s);

    // ── Connection lifecycle ─────────────────────────────────────────────────
    s.on("connect", () => {
      setIsConnected(true);
      console.log("[Socket] Connected:", s.id);
    });

    s.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("[Socket] Disconnected:", reason);
    });

    s.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    // ── Online presence ──────────────────────────────────────────────────────
    s.on("online:users", (userIds: string[]) => {
      setOnlineUsers((prev) => {
        const map = new Map(prev);
        for (const key of map.keys()) {
          if (!userIds.includes(key)) map.delete(key);
        }
        return map;
      });
    });

    s.on("user:online", (user: OnlineUser) => {
      setOnlineUsers((prev) => new Map(prev).set(user.userId, user));
    });

    s.on("user:offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const map = new Map(prev);
        map.delete(userId);
        return map;
      });
    });

    // ── Profile updates (sync across tabs) ──────────────────────────────────
    s.on("profile:updated", (data: { name: string; avatar: string; designation: string; role: string }) => {
      if (data.name) localStorage.setItem("userName", data.name);
      if (data.avatar !== undefined) localStorage.setItem("userAvatar", data.avatar);
      if (data.designation !== undefined) localStorage.setItem("userDesignation", data.designation);
      window.dispatchEvent(new Event("userProfileUpdated"));
    });

    // ── Goal status notifications (toast) ────────────────────────────────────
    s.on("goal:status_changed", (data: { status: string; title: string }) => {
      if (data.status === "Approved") {
        toast.success(`🎉 Goal Approved: "${data.title}"`);
      } else if (data.status === "Rejected") {
        toast.error(`❌ Goal Rejected: "${data.title}"`);
      } else if (data.status === "Rework Required") {
        toast.warning(`🔁 Rework Required: "${data.title}"`);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
}
