"use client";

import { useEffect } from "react";

export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = function (input, init) {
        if (typeof input === "string" && input.includes("http://localhost:5000")) {
          const newUrl = input.replace("http://localhost:5000", process.env.NEXT_PUBLIC_API_URL ||
            `http://${window.location.hostname}:5000`);
          return originalFetch(newUrl, init);
        }
        return originalFetch(input, init);
      };
      console.log("⚡ [GoalSphere Network Helper] Intercepted fetch API requests for dynamic host:", window.location.hostname);
    }
  }, []);

  return null;
}
