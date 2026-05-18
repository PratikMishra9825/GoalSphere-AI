import { ManagerSidebar } from "@/components/layout/ManagerSidebar";
import { Header } from "@/components/layout/Header";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] flex overflow-hidden">
      {/* Manager Specific Abstract Background - Amber/Orange focus */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-orange-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="flex shrink-0 shadow-2xl">
        <ManagerSidebar />
      </div>
      
      <div className="flex-1 flex flex-col w-full overflow-hidden border-l border-amber-500/10">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
