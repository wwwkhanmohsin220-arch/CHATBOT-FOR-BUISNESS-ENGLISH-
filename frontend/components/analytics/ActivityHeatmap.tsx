"use client";
/**
 * @ai-restriction
 * Primary Owner: Mohsin
 */
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// The 4 color levels mapped from the reference HTML
const HEATMAP_LEVELS = [
  "bg-[#1f1f25]",           // 0: surface-container
  "bg-[#818cf8]/30",        // 1: primary-container/30
  "bg-[#818cf8]/60",        // 2: primary-container/60
  "bg-[#818cf8]"            // 3: primary-container
];

export function ActivityHeatmap() {
  // To avoid hydration mismatch with Math.random, we generate grid on mount or use a static seeded array
  const [grid, setGrid] = useState<number[][]>([]);

  useEffect(() => {
    const newGrid: number[][] = [];
    for (let col = 0; col < 12; col++) {
      const week: number[] = [];
      for (let row = 0; row < 7; row++) {
        // Pattern logic from reference HTML: 
        // Recent weeks have more solid activity, others random
        const level = (col > 8 && row % 2 === 0) 
          ? 3 
          : (Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0);
        week.push(level);
      }
      newGrid.push(week);
    }
    setGrid(newGrid);
  }, []);

  return (
    <section className="bg-[#131318] border border-[#454653] rounded-lg p-[20px] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-semibold text-[#e4e1e9]">Activity Heatmap</h3>
        <span className="text-[12px] font-medium text-[#c6c5d5]">Last 12 Weeks</span>
      </div>
      
      <div className="w-full overflow-x-auto pb-2 pt-2 px-1 -mx-1">
        <div className="min-w-max flex gap-1 items-end">
          {/* Y-Axis Labels */}
          <div className="flex flex-col gap-1 pr-2 text-[#c6c5d5] text-[12px] uppercase tracking-wider justify-between h-[104px]">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {grid.map((week, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1">
                {week.map((level, rowIdx) => (
                  <div
                    key={`${colIdx}-${rowIdx}`}
                    className={cn(
                      "w-[12px] h-[12px] rounded-sm border border-[#454653]/30 cursor-pointer transition-transform hover:scale-125 hover:z-10",
                      HEATMAP_LEVELS[level]
                    )}
                    title={`Activity level ${level}`}
                  />
                ))}
              </div>
            ))}
            {/* Fallback while loading client side */}
            {grid.length === 0 && (
               <div className="flex flex-col gap-1 opacity-50">
                 {[0,1,0,2,0,0,3].map((l, i) => (
                    <div key={i} className={cn("w-[12px] h-[12px] rounded-sm", HEATMAP_LEVELS[l])} />
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[#c6c5d5] text-[12px] font-medium">
        <span>Less</span>
        <div className="w-3 h-3 bg-[#1f1f25] rounded-sm border border-[#454653]/30" />
        <div className="w-3 h-3 bg-[#818cf8]/30 rounded-sm border border-[#454653]/30" />
        <div className="w-3 h-3 bg-[#818cf8]/60 rounded-sm border border-[#454653]/30" />
        <div className="w-3 h-3 bg-[#818cf8] rounded-sm border border-[#454653]/30" />
        <span>More</span>
      </div>
    </section>
  );
}
