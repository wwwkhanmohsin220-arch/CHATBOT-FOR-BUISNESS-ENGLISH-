"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useCachedFetch, invalidateCache } from "@/hooks/useCachedFetch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, ChevronRight, Circle, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { UnitCelebrationOverlay } from "@/components/ui/UnitCelebrationOverlay";

const MotionLink = motion.create(Link);

interface LessonSlot {
  id: string;
  instance_id?: string;
  title: string;
  status: string;
  current_node_index: number;
  final_score?: number;
  unlocked?: boolean;
}

interface Unit {
  id: string;
  title: string;
  lessons: LessonSlot[];
}

export default function LearningPathPage() {
  const router = useRouter();
  const { data: rawCurriculum, loading } = useCachedFetch("/api/curriculum");

  // Process units synchronously to determine lock state
  let units: Unit[] = [];
  if (rawCurriculum?.units) {
    let previousCompleted = true; // First lesson is always unlocked
    units = rawCurriculum.units.map((unit: Unit) => {
      return {
        ...unit,
        lessons: unit.lessons.map((lesson) => {
          const unlocked = previousCompleted || lesson.status === "completed" || lesson.status === "in_progress";
          previousCompleted = lesson.status === "completed";
          return { ...lesson, unlocked };
        })
      };
    });
  }

  const [celebratingUnit, setCelebratingUnit] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    if (!units || units.length === 0) return;
    
    try {
      const celebrated = JSON.parse(localStorage.getItem("buslingo_celebrated_units_v2") || "[]");
      
      for (const unit of units) {
        if (unit.lessons.length > 0 && unit.lessons.every((l: LessonSlot) => l.status === "completed")) {
          if (!celebrated.includes(unit.id)) {
            celebrated.push(unit.id);
            localStorage.setItem("buslingo_celebrated_units_v2", JSON.stringify(celebrated));
            setCelebratingUnit({ id: String(unit.id), title: unit.title });
            break;
          }
        }
      }
    } catch (e) {
      console.error("Error checking celebrated units", e);
    }
  }, [rawCurriculum]);

  const handleRetry = async (e: React.MouseEvent, instanceId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/lesson-instances/${instanceId}/restart`, { method: "POST" });
      if (res.ok) {
        invalidateCache(); // Clear cache so dashboard and learn page reload
        router.push(`/lesson/${instanceId}`);
      }
    } catch (err) {
      console.error("Failed to restart lesson", err);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-16 relative">
      {celebratingUnit && (
        <UnitCelebrationOverlay 
          unitTitle={celebratingUnit.title} 
          onComplete={() => setCelebratingUnit(null)} 
        />
      )}
      <div className="max-w-[720px] mx-auto w-full relative z-10 pb-24">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] leading-tight tracking-tight font-bold text-white mb-10"
        >
          Learning path
        </motion.h1>

        {loading && units.length === 0 ? (
          <p className="text-[#8e8d9b]">Loading curriculum...</p>
        ) : units.length === 0 ? (
          <p className="text-[#8e8d9b]">No lessons available yet.</p>
        ) : (
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            initial="hidden"
            animate="show"
            className="relative pl-12"
          >
            <div className="absolute left-[15px] top-[20px] bottom-[40px] w-[2px] bg-[#242430] z-0" />
            {units.map((unit, unitIdx) => (
              <motion.div 
                key={unit.id} 
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                className="relative mb-10"
              >
                {/* Unit connector dot */}
                <div className="absolute -left-[33px] top-[6px] w-3 h-3 rounded-full bg-[#818CF8] z-10" />
                <h2 className="text-[17px] font-bold text-white mb-4">{unit.title}</h2>
                <div className="flex flex-col gap-3">
                  {unit.lessons.map((lesson, lessonIdx) => {
                    const isCompleted = lesson.status === "completed";
                    const isLocked = !lesson.unlocked;
                    const isInProgress = lesson.status === "in_progress" || lesson.status === "ready" || lesson.status === "compiling";

                    const innerContent = (
                      <>
                        {isCompleted ? (
                          <CheckCircle2 size={20} className="text-[#22c55e] shrink-0" />
                        ) : isLocked ? (
                          <Lock size={20} className="text-[#4b4b56] shrink-0" />
                        ) : isInProgress ? (
                          <PlayCircle size={20} className="text-[#818CF8] shrink-0" />
                        ) : (
                          <Circle size={20} className="text-[#8e8d9b] shrink-0" />
                        )}
                        
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className={`text-[15px] ${isLocked ? "text-[#4b4b56]" : "text-white"}`}>
                            {lesson.title}
                          </span>
                          {isInProgress && !isLocked && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="h-1.5 w-full max-w-[100px] bg-[#242430] rounded-full overflow-hidden">
                                <div className="h-full bg-[#818cf8] rounded-full" style={{ width: `${Math.min(100, Math.max(5, (lesson.current_node_index / 6) * 100))}%` }} />
                              </div>
                              <span className="text-[12px] text-[#818cf8] font-medium">In Progress</span>
                            </div>
                          )}
                        </div>

                        {!isLocked && (
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {isCompleted && lesson.final_score !== undefined && lesson.final_score !== null && (
                              <span className="text-[14px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-[6px]">
                                {lesson.final_score}%
                              </span>
                            )}
                            {isCompleted && lesson.instance_id ? (
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleRetry(e, lesson.instance_id!)}
                                className="bg-[#242430] hover:bg-[#2a2a35] text-[#c6c5d5] hover:text-[#e4e1e9] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-colors"
                              >
                                Retry
                              </motion.button>
                            ) : (
                              <ChevronRight size={18} className="text-[#4b4b56] group-hover:text-[#818CF8] transition-colors" />
                            )}
                          </div>
                        )}
                      </>
                    );

                    const className = `flex items-center gap-4 border rounded-[12px] px-5 py-4 transition-colors group ${
                      isLocked 
                        ? "bg-[#131318] border-[#242430] opacity-70" 
                        : isCompleted
                          ? "bg-[#0a0a0f] border-[#1a1a20]"
                          : "bg-[#131318] border-[#242430] hover:border-[#818CF8]"
                    }`;

                    if (isLocked) {
                      return (
                        <div key={lesson.id} className={className}>
                          {innerContent}
                        </div>
                      );
                    }

                    const href = isCompleted && lesson.instance_id 
                      ? `/lesson/complete?instanceId=${lesson.instance_id}` 
                      : `/lesson/${lesson.id}`;

                    return (
                      <MotionLink 
                        key={lesson.id} 
                        href={href} 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={className}
                      >
                        {innerContent}
                      </MotionLink>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
