"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Search, Flame, Star, Menu } from "lucide-react";

export function TopNav() {
  return (
    <header className="h-[56px] bg-[#131318] border-b border-[#1A1A22] sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Mobile menu button (hidden on desktop) */}
        <button className="md:hidden mr-4 text-[#c6c5d5] active:scale-[0.95] transition-transform">
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
          <span className="text-[14px] font-bold text-white">12</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Star size={20} className="text-[#818CF8]" fill="currentColor" />
          <span className="text-[14px] font-bold text-white">2,450</span>
        </div>
        
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-[#818CF8] to-[#4f46e5] flex items-center justify-center text-white text-[14px] font-bold ml-2 active:scale-95 transition-transform">
          U
        </button>
      </div>
    </header>
  );
}
