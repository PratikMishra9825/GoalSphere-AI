import { Target } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030303] text-white relative flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-amber-500/30">
      
      {/* Background Tech grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating Animated Gradients */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Futuristic Floating Header */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <Target className="w-5 h-5 text-black font-extrabold" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            GoalSphere <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-500 font-bold tracking-wider uppercase">AI</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 relative">
        {/* Glow behind the child card */}
        <div className="absolute inset-0 bg-amber-500/5 rounded-[32px] blur-xl pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
