"use client";
/**
 * @ai-restriction
 * Primary Owner: Mohsin
 */
import { TrendingUp, CalendarDays, BookOpen, FileText } from "lucide-react";
import { StatCard } from "@/components/analytics/StatCard";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { SkillAssessment } from "@/components/analytics/SkillAssessment";
import { RadarChart } from "@/components/analytics/RadarChart";

export default function ProgressAnalyticsPage() {
  return (
    <main className="flex-1 overflow-y-auto h-full w-full">
      <div className="max-w-[960px] mx-auto p-6 md:p-16 pb-32 flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col gap-2">
          <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight text-[#e4e1e9]">
            Analytics Overview
          </h2>
          <p className="text-[16px] text-[#c6c5d5]">
            Track your professional linguistic development.
          </p>
        </header>

        {/* 1. STAT CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={TrendingUp} 
            title="Skill Points" 
            value="2,450" 
            iconColorClass="text-[#818cf8]" 
          />
          <StatCard 
            icon={CalendarDays} 
            title="Consistency" 
            value="12" 
            unit="days" 
            iconColorClass="text-[#c6c5d5]" 
          />
          <StatCard 
            icon={FileText} 
            title="Lessons Completed" 
            value="24" 
            iconColorClass="text-[#c6c5d5]" 
          />
          <StatCard 
            icon={BookOpen} 
            title="Units Completed" 
            value="2" 
            iconColorClass="text-[#c6c5d5]" 
          />
        </section>

        {/* MIDDLE TIER: Heatmap & Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 2. WEEKLY ACTIVITY HEATMAP */}
          <ActivityHeatmap />
          
          {/* 4. STRENGTHS & WEAKNESSES */}
          <SkillAssessment />
        </div>

        {/* 3. SKILL RADAR CHART */}
        <RadarChart />

      </div>
    </main>
  );
}
