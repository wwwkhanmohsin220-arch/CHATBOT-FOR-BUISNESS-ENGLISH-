/**
 * @ai-restriction
 * Primary Owner: Umer
 * Talha: Do not modify UI/UX design, only permitted to hook up backend APIs.
 */
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[220px] min-h-screen">
        <TopNav />
        {children}
      </div>
    </div>
  );
}
