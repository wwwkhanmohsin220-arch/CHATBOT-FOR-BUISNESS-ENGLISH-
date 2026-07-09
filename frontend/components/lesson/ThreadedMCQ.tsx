"use client";

import { useState } from "react";
import { Bot, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MultipleChoice } from "./MultipleChoice";

interface ThreadedMCQProps {
  question: string;
  options: { id: string; text: string; isCorrect?: boolean; explanation?: string }[];
  onComplete: () => void;
}

type FeedbackState = "idle" | "result";

export function ThreadedMCQ({ question, options, onComplete }: ThreadedMCQProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [state, setState] = useState<FeedbackState>("idle");

  const handleSubmit = () => {
    if (!selectedId) return;
    setState("result");
  };

  const selectedOption = options.find(o => o.id === selectedId);
  const isCorrect = selectedOption?.isCorrect;

  // We map the options to the format MultipleChoice expects
  const mcqOptions = options.map(o => ({
    id: o.id,
    text: o.text
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* The Question */}
      <div className="flex gap-4 items-start pl-4 border-l-[3px] border-[#818cf8]">
        <div className="w-10 h-10 rounded-full bg-[#2a292f] flex items-center justify-center shrink-0 border border-[#35343a]">
          <Bot size={20} className="text-[#818cf8]" />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[12px] font-medium text-[#c6c5d5] uppercase tracking-wider">Knowledge Check</span>
          <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {/* Options Area */}
      <div className="pl-14 flex flex-col gap-4">
        <MultipleChoice 
          name={`mcq-${question.length}`}
          options={mcqOptions}
          selectedValue={selectedId}
          onChange={state === "idle" ? setSelectedId : () => {}}
        />
        
        {state === "idle" && (
          <button 
            onClick={handleSubmit}
            disabled={!selectedId}
            className="self-end bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-2"
          >
            Submit Answer
          </button>
        )}
      </div>

      {/* Feedback Result */}
      <AnimatePresence>
        {state === "result" && selectedOption && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pl-14 overflow-hidden"
          >
            <div className={`mt-2 rounded-[14px] p-5 border flex flex-col gap-3
              ${isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"}
            `}>
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 size={20} className="text-green-400" />
                ) : (
                  <AlertCircle size={20} className="text-yellow-400" />
                )}
                <span className={`text-[15px] font-semibold tracking-wide
                  ${isCorrect ? "text-green-400" : "text-yellow-400"}
                `}>
                  {isCorrect ? "Correct!" : "Not quite right."}
                </span>
              </div>
              
              {selectedOption.explanation && (
                <p className="text-[15px] text-[#c6c5d5] leading-relaxed">
                  {selectedOption.explanation}
                </p>
              )}

              <button 
                onClick={onComplete}
                className="mt-3 self-start bg-[#2a292f] text-white border border-[#464553] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#35343a] transition-colors active:scale-95"
              >
                Continue Lesson
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
