"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Switch({ checked, onChange, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-11 h-6 rounded-full relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131318] focus:ring-[#818cf8] transition-colors",
        checked ? "bg-[#818cf8]" : "bg-[#242430]",
        className
      )}
    >
      <span
        className={cn(
          "inline-block w-5 h-5 rounded-full shadow transform ring-0 transition duration-200 ease-in-out absolute top-0.5",
          checked ? "translate-x-5 left-[2px] bg-white" : "translate-x-0.5 left-0 bg-[#908f9e]"
        )}
      />
    </button>
  );
}
