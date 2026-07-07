"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { Bot, X, Check, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { MultipleChoice } from "@/components/lesson/MultipleChoice";

export default function StandardLessonPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [inputText, setInputText] = useState("");

  const mcqOptions = [
    { id: "1", text: "I think you're totally wrong about the budget." },
    { id: "2", text: "I see where you're coming from, but I wonder if we might need more budget for marketing." },
    { id: "3", text: "No, that budget won't work for us." }
  ];

  return (
    <div className="min-h-screen bg-[#131318] text-[#e4e1e9] flex flex-col font-sans">
      <LessonHeader 
        unitTitle="Unit 3 › Lesson 4" 
        lessonTitle="Disagreeing Politely"
        progress={60}
      />
      
      <main className="flex-1 w-full max-w-[680px] mx-auto pt-[84px] pb-[64px] px-6 md:px-0 flex flex-col gap-8">
        
        {/* Coach Message */}
        <div className="flex gap-4 items-start pl-4 border-l-[3px] border-[#818cf8] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-10 h-10 rounded-full bg-[#2a292f] flex items-center justify-center shrink-0 border border-[#35343a]">
            <Bot size={20} className="text-[#818cf8]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[#c6c5d5]">Coach</span>
            <p className="text-[18px] leading-7 text-[#e4e1e9]">
              Directly saying "I disagree" or "You're wrong" can be interpreted as aggressive in many English-speaking business cultures. Let's learn how to express opposition constructively and professionally.
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <h2 className="text-[20px] font-semibold">Why this matters</h2>
          <p className="text-[16px] text-[#c6c5d5] mb-2">
            Using softer language (mitigation) helps preserve relationships while still making your point clear.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[13px]">
              <thead>
                <tr className="border-b border-[#242430]">
                  <th className="py-2 text-[#c6c5d5] font-medium w-1/3">Technique</th>
                  <th className="py-2 text-[#c6c5d5] font-medium">Pattern</th>
                </tr>
              </thead>
              <tbody className="text-[#c6c5d5]">
                <tr className="border-b border-[#242430]/50">
                  <td className="py-3">Partial Agreement</td>
                  <td className="py-3 text-[#bdc2ff]">"I see your point, but..."</td>
                </tr>
                <tr className="border-b border-[#242430]/50">
                  <td className="py-3">Softening Phrases</td>
                  <td className="py-3 text-[#bdc2ff]">"I'm not sure I agree..."</td>
                </tr>
                <tr>
                  <td className="py-3">Suggesting Alternatives</td>
                  <td className="py-3 text-[#bdc2ff]">"What if we considered..."</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Example Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
          <div className="bg-red-500/5 border border-red-500/20 rounded-[14px] p-[20px] flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-500">
              <X size={18} />
              <span className="text-[14px] font-semibold tracking-wider">TOO DIRECT</span>
            </div>
            <p className="text-[16px] text-red-400/90">"That's a bad idea. We shouldn't do that."</p>
          </div>
          
          <div className="bg-green-500/5 border border-green-500/20 rounded-[14px] p-[20px] flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-400">
              <Check size={18} />
              <span className="text-[14px] font-semibold tracking-wider">PROFESSIONAL</span>
            </div>
            <p className="text-[16px] text-green-400/90">"I understand your perspective, but I have some concerns about the timeline."</p>
          </div>
        </div>

        {/* Multiple Choice Question */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          <h3 className="text-[18px] font-semibold">Which of these is the most professional way to disagree with a colleague's proposal?</h3>
          <MultipleChoice 
            name="disagree_mcq"
            options={mcqOptions}
            selectedValue={selectedOption}
            onChange={setSelectedOption}
          />
        </section>

        {/* Practice Input */}
        <div className="flex gap-4 items-start pl-4 border-l-[3px] border-[#818cf8] mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms] fill-mode-both">
          <div className="w-10 h-10 rounded-full bg-[#2a292f] flex items-center justify-center shrink-0 border border-[#35343a]">
            <Bot size={20} className="text-[#818cf8]" />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#c6c5d5]">Coach</span>
              <p className="text-[16px] text-[#e4e1e9]">
                Your manager just suggested launching the new feature next week. You think it needs at least two more weeks of testing. How would you reply?
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-[#1c1c23] border border-[#242430] rounded-[10px] p-4 text-[16px] text-[#e4e1e9] placeholder:text-[#52525B] focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] outline-none transition-colors resize-y min-h-[120px]" 
                placeholder="Type your response here..."
              />
              <button 
                onClick={() => router.push('/lesson/review')}
                className="self-end bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-10 px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                Submit Response
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
