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

import { useEffect, useState } from "react";

export default function ProgressAnalyticsPage() {
  const [progress, setProgress] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  
  useEffect(() => {
    Promise.all([
      fetch("/api/progress").then(r => r.json()),
      fetch("/api/me").then(r => r.json()),
      fetch("/api/dashboard").then(r => r.json()),
      fetch("/api/curriculum").then(r => r.json())
    ]).then(([prog, m, dash, cur]) => {
      setProgress(prog);
      setMe(m);
      setDashboard(dash);
      setCurriculum(cur);
    }).catch(err => console.error("Error fetching progress:", err));
  }, []);

  const totalXp = me?.total_xp || 0;
  const streak = dashboard?.streak?.count || 0;
  const lessonStats = (() => {
    const units = curriculum?.units || [];
    let completedLessons = 0;
    let completedUnits = 0;

    for (const unit of units) {
      const lessons = unit?.lessons || [];
      const unitHasLessons = lessons.length > 0;
      let unitCompleted = unitHasLessons;

      for (const lesson of lessons) {
        if (lesson?.status === "completed") {
          completedLessons += 1;
        } else {
          unitCompleted = false;
        }
      }

      if (unitCompleted) {
        completedUnits += 1;
      }
    }

    return { totalLessons, completedLessons, completedUnits };
  })();

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
            value={totalXp.toString()} 
            iconColorClass="text-[#818cf8]" 
          />
          <StatCard 
            icon={CalendarDays} 
            title="Consistency" 
            value={streak.toString()} 
            unit="days" 
            iconColorClass="text-[#c6c5d5]" 
          />
          <StatCard 
            icon={FileText} 
            title="Lessons Completed" 
            value={lessonStats.completedLessons.toString()} 
            iconColorClass="text-[#c6c5d5]" 
          />
          <StatCard 
            icon={BookOpen} 
            title="Units Completed" 
            value={lessonStats.completedUnits.toString()} 
            iconColorClass="text-[#c6c5d5]" 
          />
        </section>

        {/* MIDDLE TIER: Heatmap & Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 2. WEEKLY ACTIVITY HEATMAP */}
          <ActivityHeatmap />
          
          {/* 4. STRENGTHS & WEAKNESSES */}
          <SkillAssessment radar={progress?.radar} />
        </div>

        {/* 3. SKILL RADAR CHART */}
        <RadarChart radar={progress?.radar} />

      </div>
    </main>
  );
}
