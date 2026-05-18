"use client";

import { useEffect } from "react";

export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = function (input, init) {
        if (typeof input === "string") {
          const apiTarget = process.env.NEXT_PUBLIC_API_URL;
          
          if (apiTarget) {
            // 1. Intercept "http://localhost:5000"
            if (input.includes("http://localhost:5000")) {
              const newUrl = input.replace("http://localhost:5000", apiTarget);
              return originalFetch(newUrl, init);
            }
            // 2. Intercept dynamic local hostname "http://[domain]:5000"
            const dynamicHost = `http://${window.location.hostname}:5000`;
            if (input.includes(dynamicHost)) {
              const newUrl = input.replace(dynamicHost, apiTarget);
              return originalFetch(newUrl, init);
            }
            // 3. Intercept HTTPS version "https://[domain]:5000" (just in case)
            const dynamicHostHttps = `https://${window.location.hostname}:5000`;
            if (input.includes(dynamicHostHttps)) {
              const newUrl = input.replace(dynamicHostHttps, apiTarget);
              return originalFetch(newUrl, init);
            }
          } else {
            // Original local fallback logic
            if (input.includes("http://localhost:5000")) {
              const newUrl = input.replace("http://localhost:5000", `http://${window.location.hostname}:5000`);
              return originalFetch(newUrl, init);
            }
          }
        }
        return originalFetch(input, init);
      };
      console.log("⚡ [GoalSphere Network Helper] Intercepted fetch API requests. Production API URL:", process.env.NEXT_PUBLIC_API_URL || "Using dynamic hostname:5000");
    }
  }, []);

  return null;
}
