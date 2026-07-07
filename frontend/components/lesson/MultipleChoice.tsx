"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { cn } from "@/lib/utils";

export interface MultipleChoiceOption {
  id: string;
  text: string;
}

interface MultipleChoiceProps {
  name: string;
  options: MultipleChoiceOption[];
  selectedValue?: string;
  onChange: (id: string) => void;
  layout?: "vertical" | "grid";
}

export function MultipleChoice({ name, options, selectedValue, onChange, layout = "vertical" }: MultipleChoiceProps) {
  return (
    <div className={cn("flex gap-3 mt-2", layout === "vertical" ? "flex-col" : "flex-col sm:flex-row")}>
      {options.map((option) => {
        const isChecked = selectedValue === option.id;
        
        return (
          <label 
            key={option.id}
            className={cn(
              "group relative flex items-center p-4 rounded-[14px] border border-[#242430] bg-[#1c1c23] cursor-pointer hover:border-[#818cf8] transition-all",
              layout === "grid" && "flex-1",
              isChecked && "border-[#818cf8] bg-[#1c1c23]"
            )}
          >
            <input 
              type="radio" 
              name={name} 
              value={option.id}
              checked={isChecked}
              onChange={() => onChange(option.id)}
              className="absolute opacity-0 w-0 h-0" 
            />
            
            {/* Custom Radio Button */}
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors",
              isChecked ? "border-[#bdc2ff]" : "border-[#454653] group-hover:border-[#bdc2ff]"
            )}>
              <div className={cn(
                "w-2.5 h-2.5 rounded-full transition-transform",
                isChecked ? "bg-[#bdc2ff] scale-100" : "bg-transparent scale-0"
              )} />
            </div>
            
            {/* Active Border Glow Ring (from listening exercise ref) */}
            <div className={cn(
              "absolute inset-0 rounded-[14px] border-2 transition-colors pointer-events-none",
              isChecked ? "border-[#bdc2ff]" : "border-transparent"
            )} />
            
            <span className={cn(
              "text-[16px] transition-colors",
              isChecked ? "text-[#e4e1e9]" : "text-[#c6c5d5] group-hover:text-[#e4e1e9]"
            )}>
              {option.text}
            </span>
          </label>
        );
      })}
    </div>
  );
}
