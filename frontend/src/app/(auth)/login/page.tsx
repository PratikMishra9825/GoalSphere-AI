"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Target, Mail, Lock, Loader2, UserCheck, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Role Selection Modal States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [tempUser, setTempUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role && role !== "pending") {
      router.push(`/${role.toLowerCase()}/dashboard`);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.role === "pending") {
          setTempToken(data.token);
          setTempUser(data);
          setShowRoleModal(true);
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userAvatar", data.avatar || "");
          
          window.dispatchEvent(new Event("authChanged"));
          toast.success(`Welcome back, ${data.name}!`);
          router.push(`/${data.role.toLowerCase()}/dashboard`);
        }
      } else {
        setError(data.message || "Invalid email or password");
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Is the backend running?");
      toast.error("Could not reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    setError("");

    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.isNewUser || data.role === "pending") {
          setTempToken(data.token);
          setTempUser(data);
          setShowRoleModal(true);
          toast.info("Google verification successful! Please select your role.");
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userAvatar", data.avatar || "");

          window.dispatchEvent(new Event("authChanged"));
          toast.success(`Successfully logged in as ${data.name}!`);
          router.push(`/${data.role.toLowerCase()}/dashboard`);
        }
      } else {
        setError(data.message || "Google authentication failed on server.");
        toast.error("Google authentication failed.");
      }
    } catch (err) {
      setError("Failed to connect to authentication server.");
      toast.error("Could not verify Google authentication.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!selectedRole) {
      toast.warning("Please choose a role before continuing.");
      return;
    }

    setRoleLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/set-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userAvatar", data.avatar || "");

        window.dispatchEvent(new Event("authChanged"));
        toast.success(`Account finalized! Welcome, ${data.name}.`);
        setShowRoleModal(false);
        router.push(`/${data.role.toLowerCase()}/dashboard`);
      } else {
        toast.error(data.message || "Failed to finalize role selection.");
      }
    } catch (err) {
      toast.error("Failed to submit role. Please try again.");
    } finally {
      setRoleLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-zinc-950/80 border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden w-full"
      >
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
            <Target className="w-7 h-7 text-black font-extrabold" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-gray-400 mt-1 text-sm text-center">Sign in to your GoalSphere account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-black/40 border-white/5 text-white placeholder:text-gray-600 focus-visible:ring-amber-500 h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">Password</Label>
              <Link href="#" className="text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-black/40 border-white/5 text-white placeholder:text-gray-600 focus-visible:ring-amber-500 h-11 rounded-xl"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || googleLoading}
            className="w-full h-11 mt-6 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/10 rounded-xl relative overflow-hidden transition-all duration-300 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-4 relative">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500 uppercase font-medium">Or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Clean, Stable Google Login component with Filled Dark style */}
        <div className="mt-6 flex justify-center w-full relative">
          {googleLoading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          )}
          <div className="w-full max-w-[320px] flex justify-center opacity-95 hover:opacity-100 transition-opacity">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google Login failed. Please try again.");
                toast.error("Google sign-in failed.");
              }}
              theme="filled_dark"
              shape="pill"
              text="continue_with"
              width="320px"
            />
          </div>
        </div>

        {/* Hackathon Role Demo Quick Logins */}
        <div className="mt-6 pt-6 border-t border-white/5 relative">
          <p className="text-center text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">
            ⚡ Hackathon Role Demo Quick Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail("david@goalsphere.com");
                setPassword("password123");
                toast.success("Loaded Employee Credentials");
              }}
              className="h-9 text-[11px] border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-950/10 text-blue-400 font-medium rounded-xl"
            >
              Employee
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail("manager@goalsphere.com");
                setPassword("password123");
                toast.success("Loaded Manager Credentials");
              }}
              className="h-9 text-[11px] border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/10 text-amber-400 font-medium rounded-xl"
            >
              Manager
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail("hr@goalsphere.com");
                setPassword("password123");
                toast.success("Loaded HR Admin Credentials");
              }}
              className="h-9 text-[11px] border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/10 text-emerald-400 font-medium rounded-xl"
            >
              HR Admin
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 relative">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>

      {/* Role Selection Modal (Futuristic Glassmorphic Theme) */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950/80 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Abstract Glassmorphic Accents */}
              <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-orange-600/5 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex flex-col items-center mb-6 relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Complete Registration</h3>
                <p className="text-muted-foreground mt-1 text-center text-sm">
                  Welcome to GoalSphere! Choose your workforce role below to claim your dashboard.
                </p>
              </div>

              {/* Roles Selector list */}
              <div className="space-y-3 relative">
                {[
                  {
                    id: "employee",
                    title: "Employee",
                    desc: "Track goals, updates, and view team progress.",
                    color: "border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-950/10",
                    selectedColor: "border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/5",
                  },
                  {
                    id: "manager",
                    title: "Manager",
                    desc: "Approve goals, tasks, and view workforce simulations.",
                    color: "border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/10",
                    selectedColor: "border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/5",
                  },
                  {
                    id: "hr",
                    title: "HR Director",
                    desc: "Inject announcements, track morale, and monitor wellness.",
                    color: "border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/10",
                    selectedColor: "border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/5",
                  },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    type="button"
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 ${
                      selectedRole === role.id ? role.selectedColor : role.color
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-white">{role.title}</span>
                      {selectedRole === role.id && (
                        <span className="text-xs uppercase bg-white/10 px-2 py-0.5 rounded-full text-white/90 flex items-center gap-1 font-semibold">
                          <Sparkles className="w-3 h-3 text-amber-400" /> SELECTED
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed block">
                      {role.desc}
                    </span>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleConfirmRole}
                disabled={!selectedRole || roleLoading}
                className="w-full h-12 mt-8 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/10 relative overflow-hidden transition-all duration-300"
              >
                {roleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" />
                ) : (
                  "Confirm & Enter Portal"
                )}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
