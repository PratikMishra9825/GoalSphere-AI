"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Target, Mail, Lock, User, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const roleVal = localStorage.getItem("role");
    if (token && roleVal && roleVal !== "pending") {
      router.push(`/${roleVal.toLowerCase()}/dashboard`);
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${getBackendUrl()}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userAvatar", data.avatar || "");

        window.dispatchEvent(new Event("authChanged"));
        toast.success(`Welcome aboard, ${data.name}! Your account is ready.`);
        router.push(`/${data.role.toLowerCase()}/dashboard`);
      } else {
        setError(data.message || "Registration failed.");
        toast.error(data.message || "Failed to create account.");
      }
    } catch (err) {
      setError("Server error. Is the backend running?");
      toast.error("Could not reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-950/80 border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden w-full"
    >
      {/* Background Accents */}
      <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-30%] w-[60%] h-[60%] bg-orange-600/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex flex-col items-center mb-6 relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
          <Target className="w-6 h-6 text-black font-extrabold" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
        <p className="text-gray-400 mt-1 text-sm text-center">
          Join GoalSphere AI to align your goals and run predictions.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 relative">
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2"
          >
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="pl-10 bg-black/40 border-white/5 text-white placeholder:text-gray-600 focus-visible:ring-amber-500 h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">Work Email</Label>
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
          <Label htmlFor="password" className="text-gray-300 text-xs uppercase tracking-wider font-semibold">Password</Label>
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

        <div className="space-y-1.5">
          <Label className="text-gray-300 text-xs uppercase tracking-wider font-semibold">Account Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-black/40 border-white/5 text-white h-11 rounded-xl focus:ring-amber-500">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-xl">
              <SelectItem value="employee" className="focus:bg-amber-500/10 focus:text-amber-500">Employee</SelectItem>
              <SelectItem value="manager" className="focus:bg-amber-500/10 focus:text-amber-500">Manager</SelectItem>
              <SelectItem value="hr" className="focus:bg-amber-500/10 focus:text-amber-500">HR Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-6 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/10 rounded-xl relative overflow-hidden transition-all duration-300 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" />
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              Create Account <Sparkles className="w-4 h-4 text-black" />
            </span>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 relative">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
