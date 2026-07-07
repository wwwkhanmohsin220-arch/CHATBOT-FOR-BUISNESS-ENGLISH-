"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Flag, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HomeDashboardPage() {
  return (
    <main className="flex-1 p-6 md:p-8 max-w-[960px] mx-auto w-full">
      <h1 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-white mb-8">
        Good evening, Umer 👋
      </h1>

      {/* Top Row: Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

        {/* Daily Goal */}
        <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] flex flex-col justify-between hover:border-[#3F3F4E] transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#818CF8]/10 flex items-center justify-center text-[#818CF8]">
              <Flag size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#c6c5d5]">Daily Goal</h3>
              <p className="text-[20px] font-bold text-white">
                13 <span className="text-[14px] text-[#A0A0AB] font-normal">/ 20 mins</span>
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-[#242430] rounded-full overflow-hidden">
            <div className="h-full bg-[#818CF8] rounded-full w-[65%]" />
          </div>
        </div>

        {/* Streak Info */}
        <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] flex items-center justify-between hover:border-[#3F3F4E] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f7bd3e]/10 flex items-center justify-center text-[#f7bd3e]">
              <Flame size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#c6c5d5]">Current Streak</h3>
              <p className="text-[20px] font-bold text-white">12 Days</p>
            </div>
          </div>
          <div className="flex gap-1">
            {['M', 'T', 'W', 'T', 'F'].map((day, i) => {
              const isPast = i < 2; // M, T
              const isToday = i === 2; // W

              return (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold",
                    isPast && "bg-[#f7bd3e]/20 text-[#f7bd3e]",
                    isToday && "bg-[#f7bd3e] text-[#0A0A0F]",
                    !isPast && !isToday && "bg-[#1c1c23] border border-[#242430] text-[#c6c5d5] font-medium"
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Continue Learning Card (Hero) */}
      <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-[28px] mb-10 relative overflow-hidden group hover:border-[#818CF8] transition-colors">
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#818cf8 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <span className="text-[12px] font-medium text-[#818CF8] uppercase tracking-wider mb-2 block">
              Up Next
            </span>
            <h2 className="text-[20px] font-bold text-white mb-1">
              Unit 3: Meeting Communication
            </h2>
            <p className="text-[16px] text-[#A0A0AB] mb-6 max-w-lg">
              Mastering interruptions, clarifications, and holding the floor in high-stakes environments.
            </p>
            <div className="flex items-center gap-4 w-full max-w-md">
              <span className="text-[12px] font-medium text-[#A0A0AB]">60%</span>
              <div className="flex-1 h-1.5 bg-[#242430] rounded-full overflow-hidden">
                <div className="h-full bg-[#818CF8] rounded-full w-[60%]" />
              </div>
            </div>
          </div>

          <Link
            href="/lesson/theory"
            className="h-10 px-6 rounded-[10px] bg-transparent border border-[#818CF8] text-[#818CF8] text-[14px] font-semibold hover:bg-[#818CF8] hover:text-[#0A0A0F] transition-colors self-start md:self-center flex items-center gap-2 whitespace-nowrap active:scale-[0.98]"
          >
            Resume lesson <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}
