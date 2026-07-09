"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type FixCategory = "Grammar" | "Vocabulary" | "Tone" | "Pronunciation";

export interface TargetedFix {
  id: string;
  category: FixCategory;
  issue: string;
  suggestion: string;
  microDrillType: "text" | "mcq";
  microDrillQuestion: string;
}

interface TargetedFixCardProps {
  fix: TargetedFix;
}

export function TargetedFixCard({ fix }: TargetedFixCardProps) {
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [drillAnswer, setDrillAnswer] = useState("");
  const [drillState, setDrillState] = useState<"idle" | "grading" | "success">("idle");

  const getCategoryColor = (cat: FixCategory) => {
    switch (cat) {
      case "Grammar": return "text-green-400";
      case "Vocabulary": return "text-[#818cf8]";
      case "Tone": return "text-yellow-400";
      case "Pronunciation": return "text-pink-400";
      default: return "text-[#818cf8]";
    }
  };

  const getCategoryBg = (cat: FixCategory) => {
    switch (cat) {
      case "Grammar": return "bg-green-500/10";
      case "Vocabulary": return "bg-[#818cf8]/10";
      case "Tone": return "bg-yellow-500/10";
      case "Pronunciation": return "bg-pink-500/10";
      default: return "bg-[#818cf8]/10";
    }
  };

  const handleDrillSubmit = () => {
    if (!drillAnswer.trim()) return;
    setDrillState("grading");
    setTimeout(() => {
      setDrillState("success");
    }, 1000);
  };

  return (
    <div className="w-full bg-[#131318] border border-[#242430] rounded-[14px] overflow-hidden transition-colors hover:border-[#35343a]">
      {/* Header Area */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider ${getCategoryBg(fix.category)} ${getCategoryColor(fix.category)}`}>
            {fix.category}
          </div>
        </div>
        
        <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
          <span className="text-[#908f9e] line-through mr-2">Issue: {fix.issue}</span>
        </p>
        <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
          <Sparkles size={16} className="inline mr-2 text-[#818cf8]" />
          <span className="text-[#818cf8]">Suggestion:</span> {fix.suggestion}
        </p>

        {/* Micro Drill Toggle */}
        <button 
          onClick={() => setIsDrillOpen(!isDrillOpen)}
          className="mt-2 flex items-center justify-between w-full h-10 px-4 rounded-[10px] bg-[#1c1c23] border border-[#242430] hover:bg-[#2a292f] transition-colors text-[14px] font-semibold text-[#c6c5d5]"
        >
          <span className="flex items-center gap-2">
            <Play size={16} className="text-[#818cf8]" />
            {drillState === "success" ? "Drill Completed" : "Start Micro-Drill"}
          </span>
          {drillState === "success" ? (
            <CheckCircle2 size={18} className="text-green-400" />
          ) : isDrillOpen ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>
      </div>

      {/* Inline Micro-Drill Expandable Area */}
      <AnimatePresence>
        {isDrillOpen && drillState !== "success" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#242430] bg-[#1c1c23] overflow-hidden"
          >
            <div className="p-5 flex flex-col gap-4">
              <p className="text-[15px] text-[#c6c5d5] font-medium">
                {fix.microDrillQuestion}
              </p>
              
              <div className="flex flex-col gap-3">
                <input 
                  type="text"
                  value={drillAnswer}
                  onChange={(e) => setDrillAnswer(e.target.value)}
                  disabled={drillState !== "idle"}
                  placeholder="Type your correction..."
                  className="w-full bg-[#131318] border border-[#35343a] rounded-[10px] h-[48px] px-4 text-[15px] text-[#e4e1e9] placeholder:text-[#52525B] focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] outline-none transition-colors disabled:opacity-50"
                />
                <button 
                  onClick={handleDrillSubmit}
                  disabled={!drillAnswer.trim() || drillState !== "idle"}
                  className="self-end bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {drillState === "grading" ? "Checking..." : "Submit"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {isDrillOpen && drillState === "success" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="border-t border-[#242430] bg-green-500/5 overflow-hidden"
          >
            <div className="p-5 flex items-center gap-3 text-green-400">
              <CheckCircle2 size={24} />
              <div className="flex flex-col">
                <span className="text-[15px] font-bold">Nailed it!</span>
                <span className="text-[14px] text-green-400/80">You've successfully corrected this weakness.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
