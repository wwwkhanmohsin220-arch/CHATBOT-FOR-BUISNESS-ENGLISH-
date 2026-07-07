"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function RadarChart() {
  // We use state to trigger the CSS transition on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Slight delay to ensure the transition fires after DOM paint
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Center starting points (before animation)
  const initialPoints = "0,0 0,0 0,0 0,0 0,0 0,0";
  // The animated points from the HTML reference:
  // Points mapping: Top(Grammar), TopRight(Vocab), BotRight(Fluency), Bot(Pronunciation), BotLeft(Tone), TopLeft(Writing)
  const finalPoints = "0,-96 67.5,-39 41.5,24 0,84 -88.3,51 -62.3,-36";

  return (
    <section className="bg-[#131318] border border-[#454653] rounded-lg p-[28px] flex flex-col gap-6 items-center w-full max-w-2xl mx-auto">
      <header className="w-full text-center">
        <h3 className="text-[20px] font-semibold text-[#e4e1e9]">Proficiency Radar</h3>
        <p className="text-[14px] text-[#c6c5d5] mt-1">
          Multi-dimensional analysis of your core competencies.
        </p>
      </header>
      
      <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
        <svg className="w-full h-full drop-shadow-lg overflow-visible" viewBox="0 0 400 400">
          <g transform="translate(200, 200)">
            {/* Concentric Grid (Hexagons) */}
            <polygon className="stroke-[#454653]/30" fill="none" strokeWidth="1" points="0,-120 103.92,-60 103.92,60 0,120 -103.92,60 -103.92,-60" />
            <polygon className="stroke-[#454653]/30" fill="none" strokeWidth="1" points="0,-80 69.28,-40 69.28,40 0,80 -69.28,40 -69.28,-40" />
            <polygon className="stroke-[#454653]/30" fill="none" strokeWidth="1" points="0,-40 34.64,-20 34.64,20 0,40 -34.64,20 -34.64,-20" />
            
            {/* Axes */}
            <line className="stroke-[#454653]/50" strokeDasharray="4" strokeWidth="1" x1="0" y1="0" x2="0" y2="-120" />
            <line className="stroke-[#454653]/50" strokeDasharray="4" strokeWidth="1" x1="0" y1="0" x2="103.92" y2="-60" />
            <line className="stroke-[#454653]/50" strokeDasharray="4" strokeWidth="1" x1="0" y1="0" x2="103.92" y2="60" />
            <line className="stroke-[#454653]/50" strokeDasharray="4" strokeWidth="1" x1="0" y1="0" x2="0" y2="120" />
            <line className="stroke-[#454653]/50" strokeDasharray="4" strokeWidth="1" x1="0" y1="0" x2="-103.92" y2="60" />
            <line className="stroke-[#454653]/50" strokeDasharray="4" strokeWidth="1" x1="0" y1="0" x2="-103.92" y2="-60" />
            
            {/* Data Polygon (The 'Score') */}
            <polygon 
              className={cn(
                "fill-[#818cf8]/20 stroke-[#818cf8] transition-all duration-1000 ease-out",
                !mounted && "opacity-0"
              )} 
              points={mounted ? finalPoints : initialPoints} 
              strokeLinejoin="round" 
              strokeWidth="3" 
            />
            
            {/* Data Points */}
            <g className={cn("transition-opacity duration-1000 delay-300", mounted ? "opacity-100" : "opacity-0")}>
              <circle className="fill-[#818cf8]" cx="0" cy="-96" r="4" />
              <circle className="fill-[#818cf8]" cx="67.5" cy="-39" r="4" />
              <circle className="fill-[#818cf8]" cx="41.5" cy="24" r="4" />
              <circle className="fill-[#818cf8]" cx="0" cy="84" r="4" />
              <circle className="fill-[#818cf8]" cx="-88.3" cy="51" r="4" />
              <circle className="fill-[#818cf8]" cx="-62.3" cy="-36" r="4" />
            </g>
            
            {/* Labels */}
            <text className="fill-[#e4e1e9] text-[14px] font-semibold" textAnchor="middle" x="0" y="-135">Grammar</text>
            <text className="fill-[#e4e1e9] text-[14px] font-semibold" textAnchor="start" alignmentBaseline="middle" x="120" y="-65">Vocabulary</text>
            <text className="fill-[#e4e1e9] text-[14px] font-semibold" textAnchor="start" alignmentBaseline="middle" x="120" y="65">Fluency</text>
            <text className="fill-[#e4e1e9] text-[14px] font-semibold" textAnchor="middle" x="0" y="145">Pronunciation</text>
            <text className="fill-[#e4e1e9] text-[14px] font-semibold" textAnchor="end" alignmentBaseline="middle" x="-120" y="65">Tone</text>
            <text className="fill-[#e4e1e9] text-[14px] font-semibold" textAnchor="end" alignmentBaseline="middle" x="-120" y="-65">Writing</text>
          </g>
        </svg>
      </div>
    </section>
  );
}
