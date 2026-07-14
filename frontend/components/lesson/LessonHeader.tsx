"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { ArrowLeft, X, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LessonHeaderProps {
  unitTitle?: string;
  lessonTitle?: string;
  progress?: number; // 0 to 100
  variant?: "standard" | "minimal";
}

export function LessonHeader({ unitTitle, lessonTitle, progress = 0, variant = "standard" }: LessonHeaderProps) {
  const router = useRouter();

  if (variant === "minimal") {
    return (
      <header className="flex justify-between items-center px-6 md:px-16 py-4 w-full sticky top-0 z-50 bg-[#131318]/80 backdrop-blur-md border-b border-[#35343a]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            aria-label="Close Exercise" 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a292f] transition-colors"
          >
            <X size={20} className="text-[#c6c5d5]" />
          </button>
          <div className="h-4 w-[1px] bg-[#454653] hidden md:block" />
          <span className="text-[14px] font-semibold text-[#c6c5d5] hidden md:block">
            {unitTitle}
          </span>
        </div>
        
        <div className="text-[20px] font-bold text-[#bdc2ff] tracking-tight">
          Buslingo
        </div>
        
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a292f] transition-colors">
            <HelpCircle size={20} className="text-[#c6c5d5]" />
          </button>
        </div>
      </header>
    );
  }

  // Standard variant
  return (
    <header className="fixed top-0 w-full h-[52px] bg-[#0e0e13] border-b border-[#35343a] z-50 flex items-center justify-between px-4">
      <div className="flex items-center flex-1">
        <button 
          onClick={() => router.back()}
          className="text-[#bdc2ff] hover:text-[#e0e0ff] transition-colors flex items-center gap-2 group text-[14px] font-semibold"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>
      
      <div className="flex flex-col items-center flex-1 text-center hidden md:flex">
        <span className="text-[12px] font-medium text-[#c6c5d5] uppercase tracking-wider">
          {unitTitle}
        </span>
        <span className="text-[16px] font-semibold text-[#e4e1e9]">
          {lessonTitle}
        </span>
      </div>
      
      <div className="flex items-center justify-end flex-1 gap-4">
        <div className="w-[120px] h-[4px] bg-[#242430] rounded-full overflow-hidden hidden sm:block">
          <div 
            className="h-full bg-[#818cf8] rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </header>
  );
}
