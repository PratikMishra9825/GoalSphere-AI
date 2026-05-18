"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutDashboard, Users, BarChart, ClipboardList, LogOut, Activity, PieChart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "Manager Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { name: "Team Goals", href: "/manager/team-goals", icon: Target },
  { name: "Employees", href: "/manager/employees", icon: Users },
  { name: "Analytics", href: "/manager/analytics", icon: Activity },
  { name: "Feedback", href: "/manager/feedback", icon: ClipboardList },
  { name: "Reports", href: "/manager/reports", icon: PieChart },
];

import { useState, useEffect } from "react";

export function ManagerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ name: "Manager", role: "Manager", avatar: "" });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const storedName = localStorage.getItem("userName");
      const storedRole = localStorage.getItem("role");
      const storedAvatar = localStorage.getItem("userAvatar");
      const storedDesignation = localStorage.getItem("userDesignation");
      const token = localStorage.getItem("token");

      if (storedName) {
        setUser({
          name: storedName,
          role: storedDesignation || (storedRole ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1) : "Manager"),
          avatar: storedAvatar || ""
        });
        return;
      }

      if (token) {
        try {
          const res = await fetch("http://localhost:5000/api/auth/me", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.name) {
              localStorage.setItem("userName", data.name);
              localStorage.setItem("userAvatar", data.avatar || "");
              localStorage.setItem("role", data.role || "");
              localStorage.setItem("userDesignation", data.designation || "");
              setUser({
                name: data.name,
                role: data.designation || (data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Manager"),
                avatar: data.avatar || ""
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch user in Manager sidebar:", error);
        }
      }
    };

    loadUser();

    const handleUpdate = () => {
      const storedName = localStorage.getItem("userName");
      const storedRole = localStorage.getItem("role");
      const storedAvatar = localStorage.getItem("userAvatar");
      const storedDesignation = localStorage.getItem("userDesignation");
      if (storedName) {
        setUser({
          name: storedName,
          role: storedDesignation || (storedRole ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1) : "Manager"),
          avatar: storedAvatar || ""
        });
      }
    };
    window.addEventListener("userProfileUpdated", handleUpdate);

    const handleToggle = () => setIsMobileOpen(prev => !prev);
    const handleCloseModalEvent = () => setIsMobileOpen(false);
    window.addEventListener("toggleMobileSidebar", handleToggle);
    window.addEventListener("openEditProfileModal", handleCloseModalEvent);

    return () => {
      window.removeEventListener("userProfileUpdated", handleUpdate);
      window.removeEventListener("toggleMobileSidebar", handleToggle);
      window.removeEventListener("openEditProfileModal", handleCloseModalEvent);
    };
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChanged"));
    router.push("/login");
  };

  const renderSidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8 px-1 mt-1">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl tracking-tight text-white leading-none">GoalSphere</span>
          <span className="text-[11px] uppercase font-bold text-amber-500 mt-1.5 tracking-widest">Leadership</span>
        </div>
      </div>

      <div className="px-2 mb-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Team Management</p>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (item.href === "#") {
                  e.preventDefault();
                  toast("Feature Coming Soon", { description: `${item.name} is currently under development.` });
                }
              }}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group border border-transparent",
                isActive 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-amber-500" : "text-gray-500 group-hover:text-gray-300 transition-colors")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
        <button 
          onClick={() => window.dispatchEvent(new Event("openEditProfileModal"))}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/10 overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-amber-500">
                {user.name ? user.name.split(" ").map(n => n[0]).join("") : "M"}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white leading-none truncate group-hover:text-amber-400 transition-colors">{user.name}</p>
            <p className="text-[10px] text-amber-500/80 mt-1 truncate">{user.role}</p>
          </div>
        </button>
        
        <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all group border border-transparent">
          <LogOut className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[280px] h-screen border-r border-amber-500/10 bg-[#0a0a0a] flex-col p-5 sticky top-0 shadow-2xl z-50">
        {renderSidebarContent()}
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[60] md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-72 h-screen bg-[#0a0a0a] border-r border-amber-500/10 flex flex-col p-5 shadow-2xl z-[70]"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar pt-6">
                {renderSidebarContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
