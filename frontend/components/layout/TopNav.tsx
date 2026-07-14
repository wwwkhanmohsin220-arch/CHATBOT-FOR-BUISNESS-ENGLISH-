"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState, useRef, useEffect } from "react";
import { Search, Flame, Star, Menu, LogOut, Settings as SettingsIcon, X } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { mainNav, meNav } from "@/components/layout/Sidebar";
import { Logo } from "@/components/ui/Logo";

export function TopNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [me, setMe] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu when pathname changes (page transition)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch((e) => console.error("Failed to fetch me for TopNav:", e));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const streak = me?.streak_count || 0;
  const xp = me?.total_xp || 0;
  const initial = me?.name ? me.name.charAt(0).toUpperCase() : "G";

  return (
    <header className="h-[56px] bg-[#131318] border-b border-[#1A1A22] sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Mobile menu button (hidden on desktop) */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden mr-4 text-[#c6c5d5] hover:text-white active:scale-[0.95] transition-all"
        >
          <Menu size={24} />
        </button>
        
        <div className="relative hidden sm:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#908f9e]" />
          <input 
            type="text"
            placeholder="Search lessons, vocabulary..." 
            className="w-[280px] h-[36px] bg-[#1c1c23] border border-[#242430] rounded-full pl-10 pr-4 text-[14px] text-white placeholder:text-[#52525B] focus:border-[#818CF8] focus:ring-1 focus:ring-[#818CF8] focus:outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-[#f7bd3e]" />
          <span className="text-[14px] font-bold text-white">{streak}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Star size={20} className="text-[#818CF8]" fill="currentColor" />
          <span className="text-[14px] font-bold text-white">{xp}</span>
        </div>
        
        <div className="relative ml-2" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#818CF8] to-[#4f46e5] flex items-center justify-center text-white text-[14px] font-bold active:scale-95 transition-transform"
          >
            {initial}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1c1c23] border border-[#242430] rounded-[10px] shadow-xl py-1 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link 
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-[#c6c5d5] hover:bg-[#2a292f] hover:text-white transition-colors"
              >
                <SettingsIcon size={16} />
                Profile & Settings
              </Link>
              <button 
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  const { createClient } = await import('@/utils/supabase/client');
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  // Force a hard redirect instead of router.push to ensure middleware runs 
                  // and clears the Next.js client-side router cache (fixing the back-button bug)
                  window.location.href = '/sign-in';
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-red-400 hover:bg-[#2a292f] transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    Log Out
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-md z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#0A0A0F] border-r border-[#242430] z-50 md:hidden flex flex-col shadow-2xl"
            >
              <div className="h-[56px] flex items-center justify-between px-6 border-b border-[#242430]">
                <Logo />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-[#c6c5d5] hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {mainNav.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 active:scale-[0.98] ${
                        isActive ? "bg-[#818CF8]/10 text-[#818CF8] font-medium" : "text-[#c6c5d5] hover:bg-[#26262F] hover:text-white"
                      }`}
                    >
                      <Icon size={20} className={isActive ? "text-[#818CF8]" : ""} />
                      <span className="text-[15px] font-semibold">{item.name}</span>
                    </Link>
                  );
                })}

                <div className="pt-6 pb-2 px-3">
                  <span className="text-[12px] tracking-wider text-[#908F9E] uppercase font-medium">Me</span>
                </div>

                {meNav.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 active:scale-[0.98] ${
                        isActive ? "bg-[#818CF8]/10 text-[#818CF8] font-medium" : "text-[#c6c5d5] hover:bg-[#26262F] hover:text-white"
                      }`}
                    >
                      <Icon size={20} className={isActive ? "text-[#818CF8]" : ""} />
                      <span className="text-[15px] font-semibold">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
