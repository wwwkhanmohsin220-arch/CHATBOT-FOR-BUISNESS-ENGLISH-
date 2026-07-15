/**
 * @ai-restriction
 * Primary Owner: Umer
 * Mohsin: Do not modify UI/UX design, only permitted to hook up backend APIs.
 */
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import Aurora from "@/components/ui/Aurora";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans relative overflow-hidden select-none">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ filter: 'blur(30px)' }}>
        <Aurora
          colorStops={["#4f46e5", "#818CF8", "#0EA5E9"]}
          blend={0.6}
          amplitude={1.2}
          speed={0.7}
        />
      </div>
      <div className="z-10 flex flex-col min-h-screen relative">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-[220px] min-h-screen">
          <TopNav />
          {children}
        </div>
      </div>
    </div>
  );
}
