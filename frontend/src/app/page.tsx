"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Target, Activity, ShieldCheck, Sparkles, Brain, Cpu, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden flex flex-col items-center selection:bg-amber-500/30 font-sans">
      
      {/* Interactive Tech Grid Grid-overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Vibrant Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[140px] rounded-full pointer-events-none animate-pulse" />

      {/* Header / Navbar */}
      <header className="w-full absolute top-0 p-3 sm:p-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/[0.02] backdrop-blur-md border border-white/5 py-3 sm:py-4 px-3 sm:px-6 rounded-2xl">
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Target className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black font-extrabold" />
            </div>
            <span className="font-bold text-base sm:text-xl tracking-tight text-white flex items-center gap-1 sm:gap-1.5">
              GoalSphere <span className="hidden min-[380px]:inline-block text-[8px] sm:text-[10px] bg-amber-500/10 border border-amber-500/30 px-1.5 sm:px-2 py-0.5 rounded-full text-amber-500 font-semibold tracking-wider uppercase">AI</span>
            </span>
          </div>
          <div className="flex gap-1.5 sm:gap-4 items-center">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl px-3 sm:px-6 py-1.5 sm:py-2 shadow-lg shadow-amber-500/15 group relative overflow-hidden transition-all duration-300 text-xs sm:text-sm shrink-0">
                <span className="relative z-10 flex items-center gap-1">
                  Get Started <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black animate-pulse" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero section */}
      <main className="z-10 flex flex-col items-center text-center px-4 max-w-5xl mt-36 relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-md mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-xs font-semibold text-amber-500 tracking-wider uppercase">ENTERPRISE DECISION INTELLIGENCE</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl min-[400px]:text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 pb-2 leading-[1.05]"
        >
          Align Decisions. <br /> Predict Outcomes.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl leading-relaxed"
        >
          The next-generation AI-powered Goal & Workforce Simulator. Connect strategic alignment, 
          real-time action flows, and explainable intelligence into one single premium interface.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-base rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-[0_0_50px_rgba(245,158,11,0.2)] group relative overflow-hidden transition-all duration-300">
              <span className="relative z-10 flex items-center gap-1.5">
                Launch Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-md transition-all duration-200">
              Explore Intelligence
            </Button>
          </Link>
        </motion.div>

        {/* High-Fidelity Glassmorphic Mockup Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 w-full rounded-3xl border border-white/10 bg-[#0f0f0f]/80 p-4 shadow-2xl relative group overflow-hidden"
        >
          {/* Glass Gloss effect */}
          <div className="absolute -inset-x-20 top-0 h-40 bg-gradient-to-b from-white/[0.03] to-transparent blur-md skew-y-12 pointer-events-none group-hover:translate-y-20 transition-transform duration-700" />
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Dummy Dashboard UI Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-gray-500 ml-4 font-mono">WORKSPACE_SIMULATOR_CORE_V2.0</span>
            </div>
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg text-amber-500 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              LIVE SIMULATION ACTIVE
            </div>
          </div>

          {/* Dummy Grid layout representing the dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="md:col-span-2 p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-500" /> Morale & Morbidity Trajectory
                </h4>
                <span className="text-[10px] font-mono text-gray-400">92% CONFIDENCE</span>
              </div>
              <div className="h-40 rounded-xl bg-black/40 border border-white/5 flex items-end p-4 gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.01)_1px,transparent_1px)] bg-[size:10px_10px]" />
                <div className="w-full h-[60%] bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-md animate-pulse" />
                <div className="w-full h-[75%] bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-md animate-pulse" />
                <div className="w-full h-[40%] bg-gradient-to-t from-orange-500/20 to-orange-500 rounded-t-md animate-pulse" />
                <div className="w-full h-[90%] bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-md animate-pulse" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-500" /> AI Workforce Insight
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  "Burnout risk in the Backend Platform group elevated by 14% due to tight milestones. Recommend extending core timeline parameters."
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs mt-4">
                <span className="text-red-400 font-medium">Critical Overload Flagged</span>
                <span className="font-mono text-gray-500">89% confidence</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature list section */}
      <section id="features" className="z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4 mt-36 mb-24">
        {[
          {
            icon: Target,
            title: "SMART Goals Engine",
            desc: "AI-assisted goal checking with automatic progress validation and weighting matrices."
          },
          {
            icon: Activity,
            title: "Real-time Simulation",
            desc: "Forecast burnout, delays, and morale indexes using our futuristic workspace simulator."
          },
          {
            icon: ShieldCheck,
            title: "Role-Based Security",
            desc: "Centralized route guards protect Employee, Manager, and HR workspaces seamlessly."
          }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-300 text-left group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <feat.icon className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feat.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
