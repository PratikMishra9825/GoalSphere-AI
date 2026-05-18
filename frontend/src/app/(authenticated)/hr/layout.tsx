import { HRSidebar } from "@/components/layout/HRSidebar";
import { Header } from "@/components/layout/Header";

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* HR Specific Abstract Background - Dark Slate/Indigo focus */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex shrink-0">
        <HRSidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative bg-slate-950">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
