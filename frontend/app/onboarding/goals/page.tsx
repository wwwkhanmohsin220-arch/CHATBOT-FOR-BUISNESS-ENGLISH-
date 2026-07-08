"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Button, getButtonClasses } from "@/components/ui/Button";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Mic, Presentation, Mail, Users, FileText, CheckCircle2 } from "lucide-react";

const goals = [
  { id: "meetings", title: "Running Meetings", icon: Users },
  { id: "emails", title: "Email Drafting", icon: Mail },
  { id: "presentations", title: "Presentations", icon: Presentation },
  { id: "negotiation", title: "Negotiation", icon: Mic },
  { id: "reports", title: "Writing Reports", icon: FileText },
];

export default function SetGoalsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleGoal = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  return (
    <div className="flex flex-col flex-1 py-8 relative z-50 pointer-events-auto">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-[#1C1C23] rounded-full mb-10 overflow-hidden">
        <div className="h-full bg-[#818CF8] w-2/3 transition-all duration-500" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">What are your primary goals?</h1>
      <p className="text-[15px] text-[#A0A0AB] mb-8">
        Select the skills you want to improve. We&apos;ll prioritize these in your curriculum.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
        {goals.map((goal) => {
          const isSelected = selected.has(goal.id);
          const Icon = goal.icon;
          return (
            <button
              key={goal.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleGoal(goal.id);
              }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-[12px] border transition-all duration-200 text-left active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] block relative overflow-hidden",
                isSelected 
                  ? "bg-[#818CF8]/10 border-[#818CF8]" 
                  : "bg-[#131318] border-[#242430] hover:border-[#3F3F4E]"
              )}
            >
              <div className="flex w-full items-center gap-4 pointer-events-none relative z-10">
                <div className={cn("p-2 rounded-lg", isSelected ? "bg-[#818CF8] text-[#0A0A0F]" : "bg-[#1C1C23] text-[#A0A0AB]")}>
                  <Icon size={20} />
                </div>
                <span className={cn("font-medium flex-1", isSelected ? "text-white" : "text-[#e4e1e9]")}>
                  {goal.title}
                </span>
                {isSelected && <CheckCircle2 className="text-[#818CF8]" size={20} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-[#242430] flex justify-between">
        <Link href="/onboarding/level" className={getButtonClasses("ghost")}>
          Back
        </Link>
        {selected.size > 0 ? (
          <Link href="/sign-up" className={getButtonClasses("primary")}>
            Finish Setup
          </Link>
        ) : (
          <Button type="button" variant="primary" disabled>Finish Setup</Button>
        )}
      </div>
    </div>
  );
}
