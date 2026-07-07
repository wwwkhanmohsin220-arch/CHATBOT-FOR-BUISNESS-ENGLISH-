"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { cn } from "@/lib/utils";

// Mock data structures
const STRENGTHS = [
  "Grammar Structure",
  "Reading Comprehension",
  "Professional Tone"
];

const WEAKNESSES = [
  "Spontaneous Fluency",
  "Idiomatic Vocabulary"
];

export function SkillAssessment() {
  return (
    <section className="bg-[#131318] border border-[#454653] rounded-lg p-[20px] flex flex-col gap-6">
      <h3 className="text-[20px] font-semibold text-[#e4e1e9]">Skill Assessment</h3>
      
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Strengths */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[14px] font-semibold text-[#c6c5d5] uppercase tracking-wider border-b border-[#454653] pb-2">
            Top Strengths
          </h4>
          <ul className="flex flex-col gap-3">
            {STRENGTHS.map((skill, idx) => (
              <li key={`s-${idx}`} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#818cf8] shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                <span className="text-[16px] text-[#e4e1e9]">{skill}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Focus Areas */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[14px] font-semibold text-[#c6c5d5] uppercase tracking-wider border-b border-[#454653] pb-2">
            Focus Areas
          </h4>
          <ul className="flex flex-col gap-3">
            {WEAKNESSES.map((skill, idx) => (
              <li key={`w-${idx}`} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f7bd3e] shadow-[0_0_8px_rgba(247,189,62,0.4)]" />
                <span className="text-[16px] text-[#e4e1e9]">{skill}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
