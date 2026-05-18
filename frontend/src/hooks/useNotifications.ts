"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSocketEvent } from "@/hooks/useSocket";

const API = "http://localhost:5000/api";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read: boolean;
  createdAt: string;
  sender?: { name: string; avatar: string } | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ── Fetch from REST on mount ──────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch(`${API}/notifications?limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!mountedRef.current) return;
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (countRes.ok) {
        const { count } = await countRes.json();
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("[useNotifications] fetch error:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    return () => { mountedRef.current = false; };
  }, [fetchNotifications]);

  // ── Real-time: push new notification to top of list ───────────────────────
  useSocketEvent<Notification>("notification:new", (notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((c) => c + 1);
    // Show toast
    toast.info(notif.title, {
      description: notif.message,
      duration: 5000,
    });
  });

  // ── Live goal events — update unread badge ────────────────────────────────
  useSocketEvent("goal:created", () => {
    // Managers/HR: re-fetch count when a new goal arrives
    fetchNotifications();
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/notifications/mark-all-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[useNotifications] markAllRead error:", err);
    }
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("[useNotifications] markOneRead error:", err);
    }
  }, []);

  const deleteOne = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("[useNotifications] deleteOne error:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    deleteOne,
    refetch: fetchNotifications,
  };
}
