"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AIAssistantVoice } from "@/components/ui/AIAssistantVoice";

export default function Template({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      router.push("/login");
      return;
    }

    const lowerRole = role.toLowerCase();

    // Prevent access to dashboards that don't match the role
    if (pathname.startsWith("/manager") && lowerRole !== "manager") {
      router.push(`/${lowerRole}/dashboard`);
      return;
    }
    if (pathname.startsWith("/hr") && lowerRole !== "hr") {
      router.push(`/${lowerRole}/dashboard`);
      return;
    }
    if (pathname.startsWith("/employee") && lowerRole !== "employee") {
      router.push(`/${lowerRole}/dashboard`);
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin absolute top-0 left-0" />
          <Loader2 className="w-16 h-16 animate-spin text-white/10" />
        </div>
        <p className="text-sm font-medium text-amber-500/80 tracking-widest uppercase animate-pulse">Securing Tunnel...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
      <AIAssistantVoice />
    </motion.div>
  );
}
