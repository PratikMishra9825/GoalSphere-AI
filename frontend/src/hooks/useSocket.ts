"use client";

import { useEffect, useRef } from "react";
import { useSocketContext } from "@/contexts/SocketContext";

/**
 * Returns the socket instance and connection state from context.
 */
export function useSocket() {
  return useSocketContext();
}

/**
 * Subscribe to a socket event and clean up on unmount or when
 * `event` / `handler` change.
 *
 * @example
 * useSocketEvent("goal:created", (data) => { ... });
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
) {
  const { socket } = useSocketContext();
  // Keep a stable ref so we don't need to add handler to deps
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;
    const listener = (data: T) => handlerRef.current(data);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
