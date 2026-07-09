"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Check, Play, Lock, CheckCircle2, Circle, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type LessonStatus = "completed" | "current" | "locked";

export interface Lesson {
  id: string;
  title: string;
  status: LessonStatus;
  href?: string;
}

export type UnitStatus = "completed" | "in_progress" | "locked";

export interface Unit {
  id: string;
  title: string;
  status: UnitStatus;
  score?: number;
  completedLessons?: number;
  totalLessons: number;
  lessons?: Lesson[];
  assessmentUnlocked?: boolean;
}

interface UnitCardProps {
  unit: Unit;
  isLast?: boolean;
}

export function UnitCard({ unit, isLast }: UnitCardProps) {
  
  const isCompleted = unit.status === "completed";
  const isInProgress = unit.status === "in_progress";
  const isLocked = unit.status === "locked";

  return (
    <div className={cn("relative mb-8", isLocked && "opacity-60")}>
      {/* Active Line Override for in-progress units */}
      {isInProgress && (
        <div className="absolute left-[-45px] top-[40px] bottom-[-20px] w-[2px] bg-[#818CF8] z-0" />
      )}

      {/* Path Node */}
      <div 
        className={cn(
          "w-[32px] h-[32px] rounded-full flex items-center justify-center absolute -left-12 top-4 z-10",
          isCompleted && "bg-[#131318] border-2 border-[#22C55E] text-[#22C55E]",
          isInProgress && "bg-[#818CF8] text-[#131318]",
          isLocked && "bg-[#131318] border-2 border-[#242430] text-[#5F5F6B]"
        )}
      >
        {isCompleted && <Check size={18} strokeWidth={3} />}
        {isInProgress && <Play size={18} className="ml-1" fill="currentColor" />}
        {isLocked && <Lock size={16} />}
      </div>

      {/* Card Body */}
      {isInProgress ? (
        <div className="bg-[#131318] border border-[#818CF8]/50 rounded-[14px] overflow-hidden shadow-[0_0_20px_rgba(129,140,248,0.1)]">
          <div className="p-5 border-b border-[#242430] bg-[#1a1a21]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[12px] font-medium text-[#818CF8] uppercase tracking-wider mb-1 block">
                  In Progress
                </span>
                <h2 className="text-[20px] font-bold text-white mb-1">{unit.title}</h2>
              </div>
              <span className="bg-[#818CF8]/10 text-[#818CF8] text-[12px] font-medium px-2 py-1 rounded-md">
                {unit.completedLessons}/{unit.totalLessons}
              </span>
            </div>
            
            <div className="w-full h-1 bg-[#242430] rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-[#818CF8] rounded-full" 
                style={{ width: `${((unit.completedLessons || 0) / unit.totalLessons) * 100}%` }} 
              />
            </div>
          </div>
          
          {/* Lessons List */}
          <div className="flex flex-col">
            {unit.lessons?.map((lesson, idx) => (
              <div 
                key={lesson.id}
                className={cn(
                  "px-5 py-3 flex items-center",
                  lesson.status === "completed" && "border-b border-[#242430]/50 text-[#c6c5d5]",
                  lesson.status === "current" && "py-4 bg-[rgba(129,140,248,0.06)] border-l-2 border-[#818CF8] cursor-pointer hover:bg-[rgba(129,140,248,0.1)] transition-colors justify-between",
                  lesson.status === "locked" && "border-t border-[#242430]/50 text-[#c6c5d5] opacity-60"
                )}
              >
                <div className="flex items-center">
                  {lesson.status === "completed" && (
                    <CheckCircle2 size={20} className="text-[#22C55E] mr-3" />
                  )}
                  {lesson.status === "current" && (
                    <Circle size={20} className="text-[#818CF8] mr-3" />
                  )}
                  {lesson.status === "locked" && (
                    <Lock size={20} className="text-[#5F5F6B] mr-3" />
                  )}
                  
                  <div>
                    <span className={cn(
                      "text-[14px]",
                      lesson.status === "current" ? "text-[#F2F2F2] font-medium block text-[16px]" : "font-normal"
                    )}>
                      {lesson.title}
                    </span>
                    {lesson.status === "current" && (
                      <span className="text-[12px] text-[#818CF8] mt-1 block">Current lesson</span>
                    )}
                  </div>
                </div>

                {lesson.status === "current" && (
                  <Link 
                    href={lesson.href || "/lesson/theory"}
                    className="bg-[#818CF8] text-[#0A0A0F] px-4 py-2 rounded-[10px] text-[14px] font-semibold hover:bg-[#818CF8]/90 transition-colors active:scale-[0.98]"
                  >
                    Continue
                  </Link>
                )}
              </div>
            ))}
            
            {/* Assessment Footer */}
            <div className={cn(
              "px-5 py-4 bg-[#1a1a21] border-t border-[#242430] flex items-center justify-between mt-2",
              unit.assessmentUnlocked ? "text-[#e4e1e9]" : "text-[#c6c5d5] opacity-60"
            )}>
              <div className="flex items-center">
                <PenTool size={20} className={cn("mr-3", unit.assessmentUnlocked ? "text-[#818cf8]" : "text-[#5F5F6B]")} />
                <span className={cn("text-[16px]", unit.assessmentUnlocked ? "font-semibold text-white" : "")}>
                  Unit Assessment
                </span>
              </div>
              {unit.assessmentUnlocked && (
                <Link 
                  href="/lesson/assessment"
                  className="bg-transparent border border-[#818cf8] text-[#818cf8] px-4 py-2 rounded-[10px] text-[14px] font-semibold hover:bg-[#818CF8]/10 transition-colors active:scale-[0.98]"
                >
                  Start Assessment
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5 hover:border-[#3F3F4E] transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className={cn(
                "text-[12px] font-medium uppercase tracking-wider mb-1 block",
                isCompleted ? "text-[#22C55E]" : "text-[#5F5F6B]"
              )}>
                {isCompleted ? "Complete" : "Locked"}
              </span>
              <h2 className={cn(
                "text-[20px] font-bold mb-1",
                isCompleted ? "text-white" : "text-[#c6c5d5]"
              )}>
                {unit.title}
              </h2>
            </div>
            {isCompleted && unit.score && (
              <span className="bg-[#22C55E]/10 text-[#22C55E] text-[12px] font-medium px-2 py-1 rounded-md">
                Score: {unit.score}%
              </span>
            )}
          </div>
          <p className="text-[14px] text-[#5F5F6B] mb-4">
            {isCompleted 
              ? `${unit.completedLessons} lessons completed.` 
              : `Complete previous unit to unlock.`
            }
          </p>
          
          {isCompleted && (
            <div className="flex justify-start">
              <button 
                className="bg-transparent border border-[#818cf8] text-[#818cf8] px-4 py-2 rounded-[10px] text-[14px] font-semibold hover:bg-[#818CF8]/10 transition-colors active:scale-[0.98]"
              >
                Repeat Unit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
