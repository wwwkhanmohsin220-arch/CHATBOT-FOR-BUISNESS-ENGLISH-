/**
 * @ai-restriction
 * Primary Owner: Umer
 * Talha: Do not modify UI/UX design, only permitted to hook up backend APIs.
 */
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-16 border-b border-subtle flex items-center justify-center px-5 relative">
        <Logo className="text-xl" />
        <Link href="/" className="absolute right-5 text-[14px] text-[#A0A0AB] hover:text-white font-medium">
          Exit Setup
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center p-5 md:p-10 relative overflow-hidden">        
        <div className="w-full max-w-[600px] relative z-20 flex flex-col h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
