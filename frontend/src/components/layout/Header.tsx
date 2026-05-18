"use client";

import { Bell, Search, CheckCircle2, AlertTriangle, Clock, UserCircle, LogOut, Camera, X, Loader2, Menu, Wifi, WifiOff, Target, RefreshCcw, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useSocket } from "@/hooks/useSocket";



const PRESET_AVATARS = [
  { id: "preset-blue", name: "Ocean Breeze", url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g1)"/><circle cx="50" cy="38" r="18" fill="white" fill-opacity="0.85"/><path d="M20 80c0-15 12-25 30-25s30 10 30 25z" fill="white" fill-opacity="0.85"/></svg>` },
  { id: "preset-amber", name: "Amber Sunset", url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g2)"/><circle cx="50" cy="38" r="18" fill="white" fill-opacity="0.85"/><path d="M20 80c0-15 12-25 30-25s30 10 30 25z" fill="white" fill-opacity="0.85"/></svg>` },
  { id: "preset-emerald", name: "Aurora Green", url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g3)"/><circle cx="50" cy="38" r="18" fill="white" fill-opacity="0.85"/><path d="M20 80c0-15 12-25 30-25s30 10 30 25z" fill="white" fill-opacity="0.85"/></svg>` },
  { id: "preset-purple", name: "Cosmic Indigo", url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g4)"/><circle cx="50" cy="38" r="18" fill="white" fill-opacity="0.85"/><path d="M20 80c0-15 12-25 30-25s30 10 30 25z" fill="white" fill-opacity="0.85"/></svg>` },
  { id: "preset-gold", name: "Royal Gold", url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g5)"/><circle cx="50" cy="38" r="18" fill="white" fill-opacity="0.85"/><path d="M20 80c0-15 12-25 30-25s30 10 30 25z" fill="white" fill-opacity="0.85"/></svg>` },
  { id: "preset-dark", name: "Shadow Matrix", url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2322c55e"/><stop offset="100%" stop-color="%23111827"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g6)"/><circle cx="50" cy="38" r="18" fill="white" fill-opacity="0.85"/><path d="M20 80c0-15 12-25 30-25s30 10 30 25z" fill="white" fill-opacity="0.85"/></svg>` },
];

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "User", role: "Member", avatar: "", designation: "" });

  // ── Live notifications ───────────────────────────────────────────────────
  const { notifications, unreadCount, loading: notifLoading, markAllRead, markOneRead } = useNotifications();
  const { isConnected } = useSocket();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editBio, setEditBio] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          role: storedRole ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1) : "Member",
          avatar: storedAvatar || "",
          designation: storedDesignation || ""
        });
      }

      if (token) {
        try {
          const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
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
                role: data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Member",
                avatar: data.avatar || "",
                designation: data.designation || ""
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch user profile in Header:", error);
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
          role: storedRole ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1) : "Member",
          avatar: storedAvatar || "",
          designation: storedDesignation || ""
        });
      }
    };
    window.addEventListener("userProfileUpdated", handleUpdate);
    return () => window.removeEventListener("userProfileUpdated", handleUpdate);
  }, []);

  useEffect(() => {
    if (isEditModalOpen) {
      setEditName(user.name);
      setEditAvatar(user.avatar);
      setSelectedFile(null);
      setRemoveAvatar(false);
      
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${getBackendUrl()}/api/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data) {
            setEditEmail(data.email || "");
            setEditAvatar(data.avatar || user.avatar);
            setEditPhone(data.phone || "");
            setEditDepartment(data.department || "");
            setEditDesignation(data.designation || "");
            setEditBio(data.bio || "");
          }
        })
        .catch(err => console.error("Error loading email:", err));
      }
    }
  }, [isEditModalOpen, user]);

  useEffect(() => {
    const handleOpenModal = () => setIsEditModalOpen(true);
    window.addEventListener("openEditProfileModal", handleOpenModal);
    return () => window.removeEventListener("openEditProfileModal", handleOpenModal);
  }, []);

  // ESC key to close + body scroll lock
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsEditModalOpen(false);
    };
    if (isEditModalOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isEditModalOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
      setRemoveAvatar(false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("email", editEmail);
      formData.append("phone", editPhone);
      formData.append("department", editDepartment);
      formData.append("designation", editDesignation);
      formData.append("bio", editBio);

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      } else if (removeAvatar) {
        formData.append("removeAvatar", "true");
      } else {
        formData.append("avatar", editAvatar);
      }

      const res = await fetch(`${getBackendUrl()}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userAvatar", data.avatar || "");
        localStorage.setItem("role", data.role || "");
        localStorage.setItem("userDesignation", data.designation || "");
        
        setUser({
          name: data.name,
          role: data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : "Member",
          avatar: data.avatar || "",
          designation: data.designation || ""
        });
        
        window.dispatchEvent(new Event("userProfileUpdated"));
        toast.success("Profile updated successfully!");
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error("Server error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("authChanged"));
    toast.success("Signed out successfully");
    router.push("/login");
  };

  return (
    <>
      {/* ── Sticky Header Bar ── */}
      <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-50 w-full">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => window.dispatchEvent(new Event("toggleMobileSidebar"))}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors md:hidden mr-2 cursor-pointer flex items-center justify-center"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative w-96 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search goals, users, or departments..." 
              className="pl-9 bg-white/5 border-white/10 text-sm h-9 rounded-full focus-visible:ring-primary focus-visible:bg-white/10 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Connection status dot */}
          <div
            title={isConnected ? "Real-time: Connected" : "Real-time: Reconnecting…"}
            className={`hidden sm:flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border transition-all ${
              isConnected
                ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                : "text-amber-400 border-amber-500/20 bg-amber-500/5"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {isConnected ? "Live" : "Reconnecting"}
          </div>

          {/* Live Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-white focus:outline-none">
                <Bell className="w-5 h-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-2xl shadow-2xl p-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-1.5 py-0.5">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[380px] overflow-y-auto">
                {notifLoading ? (
                  <div className="flex flex-col gap-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/10 rounded w-2/3" />
                          <div className="h-2.5 bg-white/[0.06] rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/20">
                    <Bell className="w-6 h-6" />
                    <p className="text-xs">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    <AnimatePresence initial={false}>
                      {notifications.slice(0, 20).map((notif) => {
                        const typeColors: Record<string, string> = {
                          goal_approved: "bg-emerald-500/15 text-emerald-400",
                          goal_rejected: "bg-red-500/15 text-red-400",
                          goal_created: "bg-blue-500/15 text-blue-400",
                          goal_submitted: "bg-amber-500/15 text-amber-400",
                          goal_updated: "bg-violet-500/15 text-violet-400",
                          system: "bg-slate-700/50 text-slate-400",
                        };
                        const typeIcons: Record<string, React.ReactNode> = {
                          goal_approved: <CheckCircle2 className="w-4 h-4" />,
                          goal_rejected: <XCircle className="w-4 h-4" />,
                          goal_created: <Target className="w-4 h-4" />,
                          goal_submitted: <RefreshCcw className="w-4 h-4" />,
                          goal_updated: <RefreshCcw className="w-4 h-4" />,
                          system: <Bell className="w-4 h-4" />,
                        };
                        const colorClass = typeColors[notif.type] || typeColors.system;
                        const icon = typeIcons[notif.type] || typeIcons.system;
                        return (
                          <motion.div
                            key={notif._id}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.06] ${!notif.read ? "bg-white/[0.03]" : ""}`}
                            onClick={() => markOneRead(notif._id)}
                          >
                            <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${colorClass}`}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-none truncate ${!notif.read ? "text-white" : "text-white/50"}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-white/40 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-white/25 mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0 animate-pulse" />
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-white/10 hover:opacity-80 transition-opacity focus:outline-none text-left">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">{user.designation || user.role}</p>
                </div>
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.name ? user.name.split(" ").map(n => n[0]).join("") : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-xl border-white/10 text-white rounded-xl shadow-2xl p-2 mt-2">
              <DropdownMenuLabel className="font-semibold text-xs px-2 py-1.5 text-gray-400">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10 my-1" />
              <div onClick={() => setIsEditModalOpen(true)} className="flex gap-2 items-center text-sm p-2.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <UserCircle className="w-4 h-4 text-primary" /> Edit Profile
              </div>
              <div onClick={handleSignOut} className="flex gap-2 items-center text-sm p-2.5 rounded-lg cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4 text-red-500" /> Sign Out
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>



      {/* ── Edit Profile Modal — rendered as sibling outside <header> ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />

            {/* Scrollable overlay */}
            <div className="fixed inset-0 z-[101] overflow-hidden flex items-center justify-center p-4">
              {/* Modal card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full max-w-2xl bg-[#0d0d0f] border border-white/[0.08] rounded-2xl shadow-2xl text-white max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] rounded-t-2xl bg-white/[0.02] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                      <UserCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white leading-none">Edit Profile</h3>
                      <p className="text-[11px] text-white/40 mt-0.5">Update your personal information</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col min-h-0">
                  {/* Scrollable Form Body Container */}
                  <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-white/[0.01]">

                    {/* LEFT — Avatar panel */}
                    <div className="md:w-[200px] shrink-0 flex flex-col items-center gap-3 sm:gap-4 px-4 py-4 sm:px-5 sm:py-6 border-b md:border-b-0 md:border-r border-white/[0.06] bg-white/[0.02]">

                      {/* Avatar */}
                      <div
                        className="relative group cursor-pointer select-none"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-white/[0.08] group-hover:ring-primary/50 transition-all duration-300 shadow-xl bg-[#111]">
                          {editAvatar ? (
                            <img src={editAvatar} alt={editName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-violet-600/30 flex items-center justify-center">
                              <span className="text-2xl font-bold text-white/80">
                                {editName ? editName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <Camera className="w-5 h-5 text-white" />
                          <span className="text-[10px] text-white/80 font-medium">Change</span>
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-lg border-[2px] border-[#0d0d0f]">
                          <Camera className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />

                      {/* Name preview */}
                      <div className="text-center">
                        <p className="text-xs font-semibold text-white/75 truncate max-w-[160px]">{editName || "Your Name"}</p>
                        <p className="text-[11px] text-white/30 mt-0.5 truncate max-w-[160px]">{editDesignation || "Job title"}</p>
                      </div>

                      {/* Remove photo */}
                      {editAvatar && editAvatar !== "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" && (
                        <button
                          type="button"
                          onClick={() => { setEditAvatar("https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"); setSelectedFile(null); setRemoveAvatar(true); }}
                          className="flex items-center gap-1.5 text-[11px] text-red-400/70 hover:text-red-400 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                        >
                          <X className="w-3.5 h-3.5" /> Remove photo
                        </button>
                      )}

                      <div className="w-full border-t border-white/[0.06]" />

                      {/* Presets */}
                      <div className="w-full space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 text-center">Presets</p>
                        <div className="flex md:grid md:grid-cols-3 gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 justify-center md:justify-start no-scrollbar max-w-full">
                          {PRESET_AVATARS.map((preset) => {
                            const isSelected = editAvatar === preset.url;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                title={preset.name}
                                onClick={() => { setEditAvatar(preset.url); setSelectedFile(null); setRemoveAvatar(false); }}
                                className={`relative w-12 h-12 md:w-auto md:aspect-square rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${isSelected ? "border-primary ring-2 ring-primary/30 scale-105" : "border-white/[0.08] hover:border-white/20"}`}
                              >
                                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-[10px] text-white/20 text-center">JPG · PNG · WEBP</p>
                    </div>

                    {/* RIGHT — Form Fields */}
                    <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5">
                      {/* Personal Info */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Personal Info</p>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/45">Full Name <span className="text-red-400/80">*</span></label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} required placeholder="e.g. Priya Sharma" className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-10 rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/45">Work Email <span className="text-red-400/80">*</span></label>
                          <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required placeholder="you@company.com" className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-10 rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/45">Phone</label>
                          <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 43210" className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-10 rounded-xl text-sm" />
                        </div>
                      </div>

                      {/* Work Details */}
                      <div className="space-y-3 border-t border-white/[0.05] pt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Work Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/45">Department</label>
                            <Input value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} placeholder="Engineering" className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-10 rounded-xl text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/45">Job Title</label>
                            <Input value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="Senior Developer" className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-primary/40 focus-visible:border-primary/40 h-10 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/45">Bio</label>
                          <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="A short bio about yourself..." className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none transition-all leading-relaxed" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Fixed Pinned Footer outside scrollable area */}
                  <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-white/[0.06] bg-[#0d0d0f] shrink-0 rounded-b-2xl">
                    <p className="text-[11px] text-white/20 hidden sm:block">Changes save to your account</p>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <button type="button" className="px-4 py-2 rounded-xl text-sm text-white/45 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer border border-transparent hover:border-white/10" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
                        Cancel
                      </button>
                      <button type="submit" className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSaving}>
                        {isSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

