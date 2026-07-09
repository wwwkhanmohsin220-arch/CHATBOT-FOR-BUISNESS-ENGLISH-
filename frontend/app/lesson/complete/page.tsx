"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Star, TrendingUp, CalendarDays, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { TargetedFixCard, TargetedFix } from "@/components/lesson/TargetedFixCard";

const MOCK_FIXES: TargetedFix[] = [
  {
    id: "f1",
    category: "Vocabulary",
    issue: "You repeatedly used 'say again' when asking for clarification.",
    suggestion: "Use 'recap' or 'could you clarify' in professional settings.",
    microDrillType: "text",
    microDrillQuestion: "Rewrite this sentence: 'Can you say again what the budget is?'"
  },
  {
    id: "f2",
    category: "Tone",
    issue: "You used very direct phrasing: 'I think that's bad'.",
    suggestion: "Soften the phrasing using mitigation: 'I have some concerns about...'",
    microDrillType: "text",
    microDrillQuestion: "Mitigate this statement: 'Your timeline is wrong.'"
  },
  {
    id: "f3",
    category: "Pronunciation",
    issue: "Rushed articulation on the word 'specifically'.",
    suggestion: "Slow down and enunciate the syllables: spe-cif-i-cal-ly.",
    microDrillType: "text",
    microDrillQuestion: "Type the phonetic breakdown of 'specifically' (just for testing the drill UI)."
  }
];

export default function SessionReportCardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Geometrics (Strictly Professional) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-[0.03] text-white">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.1" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <main className="w-full max-w-[700px] mx-auto px-6 py-12 md:py-16 flex flex-col items-center z-10 relative">
        
        {/* Header Ribbon */}
        <div className="w-full flex items-center justify-between mb-12">
          <button 
            onClick={() => router.push('/learn')}
            className="flex items-center gap-2 text-[#908f9e] hover:text-white transition-colors text-[14px] font-semibold"
          >
            <ArrowLeft size={16} />
            Back to Path
          </button>
          
          <div className="flex gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-[#131318] border border-[#242430] rounded-lg px-4 py-2 flex items-center gap-2">
              <TrendingUp className="text-[#818cf8]" size={16} />
              <span className="text-[14px] font-bold text-[#818cf8]">+20 Tone</span>
            </div>
            <div className="bg-[#131318] border border-[#242430] rounded-lg px-4 py-2 flex items-center gap-2">
              <TrendingUp className="text-[#22C55E]" size={16} />
              <span className="text-[14px] font-bold text-[#22C55E]">+15 Diplomacy</span>
            </div>
            <div className="bg-[#131318] border border-[#242430] rounded-lg px-4 py-2 flex items-center gap-2">
              <CalendarDays className="text-[#c6c5d5]" size={16} />
              <span className="text-[14px] font-bold text-[#c6c5d5]">13 Day Consistency</span>
            </div>
          </div>
        </div>
        
        {/* Title */}
        <div className="w-full text-left mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex items-center gap-3 mb-2">
            <Star className="text-[#818cf8]" fill="currentColor" size={24} />
            <h1 className="text-[28px] leading-[34px] tracking-tight font-bold text-[#e4e1e9]">
              Session Report Card
            </h1>
          </div>
          <p className="text-[16px] text-[#c6c5d5] pl-[36px]">
            Unit 3 › Lesson 4: Disagreeing Politely
          </p>
        </div>

        {/* Executive Summary */}
        <div className="w-full bg-[#1c1c23] border border-[#242430] rounded-[14px] p-6 mb-10 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <h3 className="text-[14px] font-bold text-[#c6c5d5] uppercase tracking-wider mb-1">AI Coach Summary</h3>
          <p className="text-[15px] text-[#e4e1e9] leading-relaxed">
            Your ability to soften direct statements has improved significantly during this session. However, during the voice practice, you rushed the explanation of the timeline and used some overly casual vocabulary. Review the prioritized fixes below to tighten your delivery.
          </p>
        </div>

        {/* Targeted Fixes */}
        <div className="w-full flex flex-col gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-[18px] font-bold text-[#e4e1e9] mb-2 flex items-center gap-2">
            Prioritized Fixes
            <span className="bg-[#2a292f] text-[#c6c5d5] text-[12px] px-2 py-0.5 rounded-full font-medium">3</span>
          </h2>
          
          {MOCK_FIXES.map((fix) => (
            <TargetedFixCard key={fix.id} fix={fix} />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="w-full flex items-center justify-end border-t border-[#242430] pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <button 
            onClick={() => router.push('/home')}
            className="bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[48px] px-8 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Next Lesson</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </main>
    </div>
  );
}
