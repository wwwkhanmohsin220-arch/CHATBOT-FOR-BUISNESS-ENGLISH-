"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, GraduationCap, Mic, Users, BarChart2, Trophy, Settings } from "lucide-react";

export const mainNav = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Learn", href: "/learn", icon: GraduationCap }
];

export const meNav = [
  { name: "Progress", href: "/progress", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-[#0A0A0F]/60 backdrop-blur-2xl border-r border-[#1A1A22] fixed h-full flex-col z-40 hidden md:flex">
      {/* Brand */}
      <div className="h-[56px] flex items-center px-6">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 active:scale-[0.98]",
                isActive
                  ? "bg-[#818CF8]/10 text-[#818CF8] font-medium"
                  : "text-[#c6c5d5] hover:bg-[#26262F] hover:text-white"
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-[#818CF8]" : "")} />
              <span className="text-[14px] leading-4 tracking-wide font-semibold">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 pb-2 px-3">
          <span className="text-[12px] leading-4 tracking-wider text-[#908F9E] uppercase font-medium">Me</span>
        </div>

        {meNav.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 active:scale-[0.98]",
                isActive
                  ? "bg-[#818CF8]/10 text-[#818CF8] font-medium"
                  : "text-[#c6c5d5] hover:bg-[#26262F] hover:text-white"
              )}
            >
              <Icon size={20} className={cn(isActive ? "text-[#818CF8]" : "")} />
              <span className="text-[14px] leading-4 tracking-wide font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
