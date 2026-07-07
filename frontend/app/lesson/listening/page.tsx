"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { Play } from "lucide-react";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { MultipleChoice } from "@/components/lesson/MultipleChoice";

export default function ListeningExercisePage() {
  const [q1Selection, setQ1Selection] = useState("");
  const [q2Selection, setQ2Selection] = useState("");

  const q1Options = [
    { id: "a", text: "The marketing budget was overspent by 15% due to an unexpected campaign push." },
    { id: "b", text: "Supply chain disruptions have delayed product shipments by two weeks." },
    { id: "c", text: "Client retention rates have dropped slightly in the enterprise sector." }
  ];

  const q2Options = [
    { id: "a", text: "Implement a hiring freeze for Q4 to offset the budget overrun." },
    { id: "b", text: "Re-negotiate terms with the primary logistics partner immediately." },
    { id: "c", text: "Launch a targeted feedback campaign to understand client churn." }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans">
      <LessonHeader 
        variant="minimal"
        unitTitle="Unit 4: Corporate Strategy"
      />
      
      <main className="flex-grow w-full flex justify-center py-10 px-6 md:px-0">
        <div className="w-full max-w-[680px] flex flex-col gap-10 pb-20">
          
          {/* Heading Section */}
          <section className="flex flex-col gap-2">
            <h1 className="text-[24px] md:text-[32px] font-bold tracking-tight text-[#e4e1e9]">
              Board Meeting Discussion
            </h1>
            <p className="text-[14px] text-[#c6c5d5]">
              Listen to the conversation and answer the questions below.
            </p>
          </section>

          {/* Audio Player Card */}
          <section className="bg-[#131318] border border-[#35343a] rounded-xl p-4 flex items-center gap-4 h-[64px] shadow-sm">
            <button aria-label="Play Audio" className="w-9 h-9 rounded-full bg-[#818cf8] flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity">
              <Play fill="currentColor" size={16} className="text-[#0A0A0F] ml-1" />
            </button>
            
            <div className="flex-grow flex items-center gap-3 relative">
              {/* Fake waveform/scrub track */}
              <div className="w-full h-1 bg-[#35343a] rounded-full relative cursor-pointer">
                <div className="absolute left-0 top-0 h-full bg-[#818cf8] rounded-full w-1/3" />
                <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#818cf8] rounded-full shadow-sm" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-[12px] font-medium text-[#c6c5d5] font-mono">1:24 / 3:45</span>
              <button className="text-[12px] font-medium text-[#c6c5d5] hover:text-[#bdc2ff] transition-colors px-2 py-1 rounded border border-transparent hover:border-[#35343a]">
                1x
              </button>
            </div>
          </section>

          {/* Questions Form */}
          <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
            
            {/* Question 1 */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium leading-tight text-[#908f9e] uppercase tracking-widest">
                  Question 1 of 4
                </span>
                <h2 className="text-[16px] leading-relaxed text-[#e4e1e9] font-medium">
                  What is the primary concern raised by the CFO regarding the Q3 projections?
                </h2>
              </div>
              <MultipleChoice 
                name="q1"
                options={q1Options}
                selectedValue={q1Selection}
                onChange={setQ1Selection}
              />
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-[#35343a]" />

            {/* Question 2 */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium leading-tight text-[#908f9e] uppercase tracking-widest">
                  Question 2 of 4
                </span>
                <h2 className="text-[16px] leading-relaxed text-[#e4e1e9] font-medium">
                  How does the CEO propose addressing the issue discussed?
                </h2>
              </div>
              <MultipleChoice 
                name="q2"
                options={q2Options}
                selectedValue={q2Selection}
                onChange={setQ2Selection}
              />
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button 
                type="submit"
                className="w-full h-12 bg-[#818cf8] text-[#0A0A0F] font-semibold text-[14px] rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] focus:ring-[#818cf8] active:scale-[0.98]"
              >
                Check answers
              </button>
            </div>

          </form>

        </div>
      </main>
    </div>
  );
}
