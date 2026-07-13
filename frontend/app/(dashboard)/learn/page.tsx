"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, ChevronRight, Circle, PlayCircle } from "lucide-react";

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
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/curriculum")
      .then((r) => r.json())
      .then((data) => {
        let previousCompleted = true; // First lesson is always unlocked
        
        const processedUnits = (data.units || []).map((unit: Unit) => {
          return {
            ...unit,
            lessons: unit.lessons.map((lesson) => {
              const unlocked = previousCompleted || lesson.status === "completed" || lesson.status === "in_progress";
              previousCompleted = lesson.status === "completed";
              
              return {
                ...lesson,
                unlocked
              };
            })
          };
        });
        
        setUnits(processedUnits);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-16 relative">
      <div className="max-w-[720px] mx-auto w-full relative z-10 pb-24">
        <h1 className="text-[28px] leading-tight tracking-tight font-bold text-white mb-10">
          Learning path
        </h1>

        {loading ? (
          <p className="text-[#8e8d9b]">Loading curriculum...</p>
        ) : units.length === 0 ? (
          <p className="text-[#8e8d9b]">No lessons available yet.</p>
        ) : (
          <div className="relative pl-12">
            <div className="absolute left-[15px] top-[20px] bottom-[40px] w-[2px] bg-[#242430] z-0" />
            {units.map((unit, unitIdx) => (
              <div key={unit.id} className="relative mb-10">
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
                        
                        <div className="flex-1 flex flex-col">
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
                          <div className="flex items-center gap-3">
                            {isCompleted && lesson.final_score !== undefined && lesson.final_score !== null && (
                              <span className="text-[14px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-[6px]">
                                {lesson.final_score}%
                              </span>
                            )}
                            <ChevronRight size={18} className="text-[#4b4b56] group-hover:text-[#818CF8] transition-colors" />
                          </div>
                        )}
                      </>
                    );

                    const className = `flex items-center gap-4 bg-[#131318] border border-[#242430] rounded-[12px] px-5 py-4 transition-colors group ${
                      isLocked ? "opacity-70" : "hover:border-[#818CF8]"
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
                      <Link key={lesson.id} href={href} className={className}>
                        {innerContent}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
