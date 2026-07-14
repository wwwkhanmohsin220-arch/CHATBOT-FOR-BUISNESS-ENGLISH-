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
import { useCachedFetch } from "@/hooks/useCachedFetch";
import { motion } from "framer-motion";

export default function ProgressAnalyticsPage() {
  const { data: progress } = useCachedFetch("/api/progress");
  const { data: me } = useCachedFetch("/api/me");
  const { data: dashboard } = useCachedFetch("/api/dashboard");
  const { data: curriculum } = useCachedFetch("/api/curriculum");

  const totalXp = me?.total_xp || 0;
  const streak = dashboard?.streak?.count || 0;
  
  const lessonStats = (() => {
    const units = curriculum?.units || [];
    let totalLessons = 0;
    let completedLessons = 0;
    let completedUnits = 0;

    for (const unit of units) {
      const lessons = unit?.lessons || [];
      totalLessons += lessons.length;
      
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
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="show"
        className="max-w-[960px] mx-auto p-6 md:p-16 pb-32 flex flex-col gap-8"
      >
        
        {/* Header */}
        <motion.header variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex flex-col gap-2">
          <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight text-[#e4e1e9]">
            Analytics Overview
          </h2>
          <p className="text-[16px] text-[#c6c5d5]">
            Track your professional linguistic development.
          </p>
        </motion.header>

        {/* 1. STAT CARDS */}
        <motion.section 
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
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
        </motion.section>

        {/* MIDDLE TIER: Heatmap & Strengths */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 2. WEEKLY ACTIVITY HEATMAP */}
          <ActivityHeatmap activity={progress?.activity} />
          
          {/* 4. STRENGTHS & WEAKNESSES */}
          <SkillAssessment radar={progress?.radar} />
        </motion.div>

        {/* 3. SKILL RADAR CHART */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <RadarChart radar={progress?.radar} />
        </motion.div>

      </motion.div>
    </main>
  );
}
