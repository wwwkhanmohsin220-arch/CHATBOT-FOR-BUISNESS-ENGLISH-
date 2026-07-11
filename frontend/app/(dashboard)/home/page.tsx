"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Flag, Flame, ArrowRight, Bookmark } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

export default function HomeDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, meRes] = await Promise.all([
          fetch("http://localhost:8000/api/dashboard"),
          fetch("http://localhost:8000/api/me")
        ]);
        setDashboard(await dashRes.json());
        setMe(await meRes.json());
      } catch (e) {
        console.error("Failed to fetch dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <main className="flex-1 p-6 md:p-8 max-w-[960px] mx-auto w-full"><div className="text-[#8e8d9b] py-4">Loading dashboard...</div></main>;
  }

  const name = me?.name || "Umer";
  const daily = dashboard?.daily_goal || { minutes: 0, target: 20 };
  const streak = dashboard?.streak || { count: 0, week_days: [] };
  const next = dashboard?.next_lesson || { title: "No upcoming lesson", slot_key: "" };
  const srsCount = dashboard?.srs_due_count || 0;

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[960px] mx-auto w-full">
      <h1 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-white mb-8">
        Good evening, {name} 👋
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
                {daily.minutes} <span className="text-[14px] text-[#A0A0AB] font-normal">/ {daily.target} mins</span>
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-[#242430] rounded-full overflow-hidden">
            <div className="h-full bg-[#818CF8] rounded-full" style={{ width: `${Math.min(100, (daily.minutes / daily.target) * 100)}%` }} />
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
              <p className="text-[20px] font-bold text-white">{streak.count} Days</p>
            </div>
          </div>
          <div className="flex gap-1">
            {streak.week_days.length > 0 ? streak.week_days.map((dayObj: any, i: number) => {
              const dayStr = new Date(dayObj.day).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
              const isActive = dayObj.active;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold",
                    isActive ? "bg-[#f7bd3e] text-[#0A0A0F]" : "bg-[#1c1c23] border border-[#242430] text-[#c6c5d5] font-medium"
                  )}
                >
                  {dayStr}
                </div>
              );
            }) : ['M', 'T', 'W', 'T', 'F'].map((day, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold bg-[#1c1c23] border border-[#242430] text-[#c6c5d5] font-medium">
                {day}
              </div>
            ))}
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
              {next.title}
            </h2>
            <p className="text-[16px] text-[#A0A0AB] mb-6 max-w-lg">
              Continue your learning path.
            </p>
            <div className="flex items-center gap-4 w-full max-w-md">
              <span className="text-[12px] font-medium text-[#A0A0AB]">0%</span>
              <div className="flex-1 h-1.5 bg-[#242430] rounded-full overflow-hidden">
                <div className="h-full bg-[#818CF8] rounded-full w-[0%]" />
              </div>
            </div>
          </div>

          <Link
            href={next.slot_key ? `/lesson/${next.slot_key}` : "#"}
            className="h-10 px-6 rounded-[10px] bg-transparent border border-[#818CF8] text-[#818CF8] text-[14px] font-semibold hover:bg-[#818CF8] hover:text-[#0A0A0F] transition-colors self-start md:self-center flex items-center gap-2 whitespace-nowrap active:scale-[0.98]"
          >
            Resume lesson <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Business Lexicon Daily Review Widget */}
      <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[#3F3F4E] transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#818CF8]/10 flex items-center justify-center text-[#818CF8] shrink-0">
            <Bookmark size={24} />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-white mb-1">Business Lexicon</h3>
            <p className="text-[15px] text-[#A0A0AB]">
              <span className="text-[#e4e1e9] font-medium">12 terms</span> due for spaced repetition.
            </p>
          </div>
        </div>
        
        <Link 
          href="/lesson/vocabulary"
          className="h-10 px-6 rounded-[10px] bg-[#818CF8] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
        >
          Start 90s Review
          <ArrowRight size={18} />
        </Link>
      </div>

    </main>
  );
}
