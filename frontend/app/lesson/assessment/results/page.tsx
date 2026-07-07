"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useEffect, useState } from "react";
import { X, Check, Lightbulb, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AssessmentResultsPage() {
  const router = useRouter();
  const [dashoffset, setDashoffset] = useState(515.22); // Start empty (100% offset)
  const score = 85;

  useEffect(() => {
    // Animate the circle after mount
    setTimeout(() => {
      // 515.22 is circumference of r=82 circle
      const offset = 515.22 - ( (score / 100) * 515.22 );
      setDashoffset(offset);
    }, 100);
  }, [score]);

  return (
    <div className="min-h-screen bg-[#131318] text-[#e4e1e9] font-sans flex flex-col antialiased">
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start w-full max-w-[720px] mx-auto px-6 md:px-16 py-12">
        
        {/* Celebration Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold flex items-center justify-center gap-2">
            🎉 Assessment Complete!
          </h1>
        </div>

        {/* Score Ring Section */}
        <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="relative w-[180px] h-[180px] mb-6">
            <svg className="w-full h-full -rotate-90 origin-center" viewBox="0 0 180 180">
              {/* Track */}
              <circle cx="90" cy="90" fill="transparent" r="82" stroke="#1C1C23" strokeWidth="8" />
              {/* Fill */}
              <circle 
                cx="90" cy="90" 
                fill="transparent" 
                r="82" 
                stroke="#818CF8" 
                strokeWidth="8" 
                strokeLinecap="round"
                strokeDasharray="515.22"
                strokeDashoffset={dashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[48px] font-bold tracking-[-0.02em]">{score}%</span>
            </div>
          </div>
          
          <div className="text-center flex flex-col gap-1">
            <span className="text-[14px] text-[#908f9e]">Unit 3: Meeting Communication</span>
            <span className="text-[14px] text-[#908f9e]">17 of 20 correct</span>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="w-full grid grid-cols-3 gap-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <div className="bg-[#131318] border border-[#242430] rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] text-[#908f9e] mb-1 font-medium">Grammar</span>
            <span className="text-[22px] font-bold text-[#e4e1e9]">90%</span>
          </div>
          <div className="bg-[#131318] border border-[#242430] rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] text-[#908f9e] mb-1 font-medium">Vocabulary</span>
            <span className="text-[22px] font-bold text-[#e4e1e9]">80%</span>
          </div>
          <div className="bg-[#131318] border border-[#242430] rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] text-[#908f9e] mb-1 font-medium">Tone</span>
            <span className="text-[22px] font-bold text-[#e4e1e9]">85%</span>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="w-full mb-12 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <h2 className="text-[18px] font-semibold text-[#e4e1e9] mb-2">Review your answers</h2>
          
          {/* Incorrect Question Card 1 */}
          <div className="bg-[#131318] border border-[#242430] rounded-xl p-5 flex flex-col gap-4 hover:border-[#3F3F4E] transition-colors">
            <p className="text-[16px] text-[#e4e1e9]">
              <span className="text-[#908f9e] mr-2">Q4.</span>
              Which phrase is most appropriate for interrupting politely during a meeting?
            </p>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 text-[#ffb4ab]">
                <X size={20} className="mt-0.5 shrink-0" />
                <span className="line-through">Hey, listen to me for a second.</span>
              </div>
              <div className="flex items-start gap-3 text-[#4ADE80]">
                <Check size={20} className="mt-0.5 shrink-0" />
                <span>Excuse me, may I interject here?</span>
              </div>
            </div>
            
            <div className="mt-2 p-3 bg-[#1b1b20] rounded-lg flex items-start gap-2 border border-[#242430]">
              <Lightbulb className="text-[#908f9e] shrink-0 mt-0.5" size={18} />
              <p className="text-[12px] font-medium text-[#908f9e] leading-relaxed">
                "Hey, listen to me" is too aggressive for professional settings. "May I interject" is standard business etiquette for joining an ongoing conversation.
              </p>
            </div>
          </div>

          {/* Incorrect Question Card 2 */}
          <div className="bg-[#131318] border border-[#242430] rounded-xl p-5 flex flex-col gap-4 hover:border-[#3F3F4E] transition-colors">
            <p className="text-[16px] text-[#e4e1e9]">
              <span className="text-[#908f9e] mr-2">Q12.</span>
              Select the best word to complete the sentence: "We need to _____ the key action items before ending the call."
            </p>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 text-[#ffb4ab]">
                <X size={20} className="mt-0.5 shrink-0" />
                <span className="line-through">say again</span>
              </div>
              <div className="flex items-start gap-3 text-[#4ADE80]">
                <Check size={20} className="mt-0.5 shrink-0" />
                <span>recap</span>
              </div>
            </div>
            
            <div className="mt-2 p-3 bg-[#1b1b20] rounded-lg flex items-start gap-2 border border-[#242430]">
              <Lightbulb className="text-[#908f9e] shrink-0 mt-0.5" size={18} />
              <p className="text-[12px] font-medium text-[#908f9e] leading-relaxed">
                "Recap" is the precise business term for summarizing previously discussed points. "Say again" is overly casual.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms] fill-mode-both">
          <button className="w-full sm:w-auto h-10 px-6 rounded-[10px] bg-transparent border border-[#818CF8] text-[#818CF8] text-[14px] font-semibold hover:bg-[#818CF8]/10 transition-colors active:scale-95">
            Review mistakes
          </button>
          <button 
            onClick={() => router.push('/home')}
            className="w-full sm:w-auto h-10 px-6 rounded-[10px] bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            Continue to Unit 4
            <ArrowRight size={18} />
          </button>
        </div>

      </main>
    </div>
  );
}
