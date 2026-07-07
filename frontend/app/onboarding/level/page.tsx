"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Button, getButtonClasses } from "@/components/ui/Button";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const levels = [
  { id: "beginner", title: "Beginner", description: "I know basic phrases but struggle in business meetings." },
  { id: "intermediate", title: "Intermediate", description: "I can communicate, but lack professional vocabulary and confidence." },
  { id: "advanced", title: "Advanced", description: "I am fluent, but want to perfect my tone, nuance, and leadership presence." },
];

export default function SelectLevelPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 py-8 relative z-50 pointer-events-auto">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-[#1C1C23] rounded-full mb-10 overflow-hidden">
        <div className="h-full bg-[#818CF8] w-1/3 transition-all duration-500" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">What is your current English level?</h1>
      <p className="text-[15px] text-[#A0A0AB] mb-8">
        This helps us calibrate the AI's speaking speed and vocabulary complexity.
      </p>

      <div className="flex flex-col gap-4 flex-1">
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setSelected(level.id);
            }}
            className={cn(
              "w-full text-left p-5 rounded-[14px] border transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] block relative overflow-hidden",
              selected === level.id 
                ? "bg-[#818CF8]/10 border-[#818CF8]" 
                : "bg-[#131318] border-[#242430] hover:border-[#3F3F4E]"
            )}
          >
            <div className="pointer-events-none relative z-10">
              <h3 className={cn("text-[16px] font-semibold mb-1 transition-colors", selected === level.id ? "text-[#818CF8]" : "text-white")}>
                {level.title}
              </h3>
              <p className="text-[14px] text-[#A0A0AB] leading-relaxed">{level.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[#242430] flex justify-between">
        <Link href="/onboarding" className={getButtonClasses("ghost")}>
          Back
        </Link>
        {selected ? (
          <Link href="/onboarding/goals" className={getButtonClasses("primary")}>
            Continue
          </Link>
        ) : (
          <Button type="button" variant="primary" disabled>Continue</Button>
        )}
      </div>
    </div>
  );
}
