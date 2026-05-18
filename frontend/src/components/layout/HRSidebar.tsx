"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, BarChart, Settings, LogOut, ShieldAlert, FolderKanban, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "Overview", href: "/hr/dashboard", icon: LayoutDashboard },
  { name: "Directory", href: "/hr/employees", icon: Users },
  { name: "Managers", href: "/hr/managers", icon: ShieldAlert },
  { name: "Departments", href: "/hr/departments", icon: FolderKanban },
  { name: "Reporting", href: "/hr/reports", icon: FileSpreadsheet },
  { name: "Recruitment", href: "/hr/recruitment", icon: Briefcase },
  { name: "Settings", href: "/hr/settings", icon: Settings },
];

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function HRSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ name: "Admin", role: "HR", avatar: "" });
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
          role: storedDesignation || (storedRole ? storedRole.toUpperCase() : "HR"),
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
                role: data.designation || (data.role ? data.role.toUpperCase() : "HR"),
                avatar: data.avatar || ""
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch user in HR sidebar:", error);
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
          role: storedDesignation || (storedRole ? storedRole.toUpperCase() : "HR"),
          avatar: storedAvatar || ""
        });
      }
    };
    window.addEventListener("userProfileUpdated", handleUpdate);

    const handleToggle = () => setIsMobileOpen(prev => !prev);
    window.addEventListener("toggleMobileSidebar", handleToggle);

    return () => {
      window.removeEventListener("userProfileUpdated", handleUpdate);
      window.removeEventListener("toggleMobileSidebar", handleToggle);
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
      <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 shrink-0">
        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center mr-3 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-slate-900" />
        </div>
        <span className="font-bold text-sm tracking-tight text-slate-100 uppercase">GoalSphere HR</span>
      </div>

      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="px-4 mb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Controls</p>
        </div>
        <nav className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.href === "#") {
                    e.preventDefault();
                    toast("Admin Module Locked", { description: `${item.name} module is being initialized.` });
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30 shrink-0">
        <button 
          onClick={() => window.dispatchEvent(new Event("openEditProfileModal"))}
          className="w-full flex items-center gap-3 mb-4 px-2 hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors text-left group cursor-pointer"
        >
          <Avatar className="h-8 w-8 border border-slate-700 bg-slate-800 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-xs font-semibold">
              {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium text-slate-200 leading-none truncate group-hover:text-white transition-colors">{user.name}</p>
            <p className="text-[10px] text-slate-500 mt-1 truncate">{user.role}</p>
          </div>
        </button>
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-[240px] h-screen border-r border-slate-800 bg-slate-950 flex-col sticky top-0 z-50">
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
              className="relative w-64 h-screen bg-slate-950 border-r border-slate-800 flex flex-col shadow-2xl z-[70]"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-3.5 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center z-50"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
                {renderSidebarContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
