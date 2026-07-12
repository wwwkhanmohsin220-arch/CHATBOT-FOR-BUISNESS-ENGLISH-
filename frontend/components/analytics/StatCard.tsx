"use client";
/**
 * @ai-restriction
 * Primary Owner: Mohsin
 */
import { ElementType } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ElementType;
  title: string;
  value: string | number;
  unit?: string;
  iconColorClass: string;
  children?: React.ReactNode;
}

export function StatCard({ icon: Icon, title, value, unit, iconColorClass, children }: StatCardProps) {
  return (
    <div className="bg-[#131318] border border-[#454653] rounded-lg p-[20px] flex flex-col gap-2 group hover:border-[#818cf8] transition-colors relative overflow-hidden">
      {/* Background large icon */}
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Icon size={120} strokeWidth={1.5} />
      </div>
      
      {/* Header */}
      <div className={cn("flex items-center gap-2", iconColorClass)}>
        <Icon size={20} fill="currentColor" />
        <span className="text-[14px] font-semibold tracking-[0.01em] text-inherit">{title}</span>
      </div>
      
      {/* Value */}
      <div className="text-[20px] md:text-[48px] leading-[28px] md:leading-[56px] font-bold tracking-[-0.02em] text-[#e4e1e9] flex items-baseline gap-1 relative z-10">
        {value}
        {unit && (
          <span className="text-[14px] leading-[20px] font-normal text-[#c6c5d5]">
            {unit}
          </span>
        )}
      </div>

      {/* Optional extra content (like buttons) */}
      {children && (
        <div className="mt-auto pt-2 relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
