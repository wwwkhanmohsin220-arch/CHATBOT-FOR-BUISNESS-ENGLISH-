"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { MultipleChoice } from "@/components/lesson/MultipleChoice";

export default function UnitAssessmentPage() {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const mcqOptions = [
    { id: "a", text: "I think you're wrong about this." },
    { id: "b", text: "I completely disagree with that point." },
    { id: "c", text: "I see it differently — here's my perspective." },
    { id: "d", text: "That doesn't make any sense." }
  ];

  const handleNext = () => {
    router.push('/lesson/assessment/results');
  };

  return (
    <div className="min-h-screen bg-[#0e0e13] text-[#e4e1e9] font-sans flex flex-col antialiased">
      
      {/* Assessment Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0A0A0F] border-b border-[#454653] h-[52px] flex items-center justify-between px-6 md:px-16">
        {/* Left: Unit Info */}
        <div className="flex items-center">
          <h1 className="text-[#F2F2F2] text-[14px] font-semibold">Unit 3 Assessment</h1>
        </div>
        
        {/* Center: Progress Bar */}
        <div className="flex-1 max-w-[200px] mx-4 hidden md:block">
          <div className="w-full h-1 bg-[#242430] rounded-full overflow-hidden">
            <div className="h-full bg-[#818cf8] rounded-full transition-all duration-500" style={{ width: '33.33%' }} />
          </div>
        </div>
        
        {/* Right: Progress Text */}
        <div className="flex items-center">
          <span className="text-[#A0A0AB] text-[13px] font-medium tracking-wide">Question 4 of 12</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-[100px] pb-16 px-6 md:px-0 flex flex-col items-center">
        <div className="w-full max-w-[680px] flex flex-col">
          
          {/* Question Content */}
          <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[#F2F2F2] text-[18px] leading-relaxed text-left">
              "Which phrase is most appropriate when disagreeing with a senior colleague's proposal during a board meeting?"
            </p>
          </div>

          {/* Options Area */}
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
            <MultipleChoice 
              name="assessment_q4"
              options={mcqOptions}
              selectedValue={selectedAnswer}
              onChange={setSelectedAnswer}
            />

            {/* Action Area */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="bg-[#818cf8] disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0F] h-10 px-6 rounded-[10px] text-[14px] font-semibold flex items-center gap-2 hover:bg-[#bdc2ff] transition-colors active:scale-95"
              >
                Next
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
