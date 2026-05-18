"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutDashboard, CheckSquare, Bell, LogOut, KanbanSquare, UserCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "My Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { name: "My Goals", href: "/employee/goals", icon: Target },
  { name: "Progress Tracker", href: "/employee/board", icon: KanbanSquare },
  { name: "Reviews & Check-Ins", href: "/employee/checkins", icon: CheckSquare },
  { name: "Notifications", href: "/employee/notifications", icon: Bell },
  { name: "Profile", href: "#", icon: UserCircle },
];

import { useState, useEffect } from "react";

export function EmployeeSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ name: "Employee", role: "Employee", avatar: "" });
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
          role: storedDesignation || (storedRole ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1) : "Employee"),
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
                role: data.designation || (data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Employee"),
                avatar: data.avatar || ""
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch user in Employee sidebar:", error);
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
          role: storedDesignation || (storedRole ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1) : "Employee"),
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

  // Body scroll lock when sidebar is open
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
      <div className="flex items-center gap-3 mb-10 px-2 mt-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30 ring-1 ring-white/10">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-tight text-white leading-none">GoalSphere</span>
          <span className="text-[10px] uppercase font-semibold text-primary mt-1 tracking-wider">Workspace</span>
        </div>
      </div>

      <div className="px-2 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal</p>
      </div>

      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (item.name === "Profile") {
                  e.preventDefault();
                  window.dispatchEvent(new Event("openEditProfileModal"));
                } else if (item.href === "#") {
                  e.preventDefault();
                  toast("Feature Coming Soon", { description: `${item.name} is currently under development.` });
                }
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-primary/30" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-primary rounded-r-full" />}
              <item.icon className={cn("w-5 h-5 relative z-10", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white transition-colors")} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
        <button 
          onClick={() => window.dispatchEvent(new Event("openEditProfileModal"))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary">
                {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white leading-none truncate group-hover:text-primary transition-colors">{user.name}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user.role}</p>
          </div>
        </button>

        <button onClick={handleSignOut} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:ring-1 hover:ring-red-500/30 transition-all group">
          <span className="flex items-center gap-3">
            <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
            Sign Out
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen border-r border-white/10 bg-black/40 backdrop-blur-2xl flex-col p-4 sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50">
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
              className="relative w-72 h-screen bg-[#080810] border-r border-white/10 flex flex-col p-4 shadow-2xl z-[70]"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
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
