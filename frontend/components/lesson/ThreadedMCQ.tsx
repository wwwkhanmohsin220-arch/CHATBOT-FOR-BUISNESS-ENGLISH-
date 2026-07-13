"use client";

import { useState } from "react";
import { Bot, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MultipleChoice } from "./MultipleChoice";

interface ThreadedMCQProps {
  question: string;
  options: string[];
  onSubmitAttempt: (answerIndex: number) => Promise<void>;
  feedback: { correct: boolean; explanation?: string } | null;
  onAdvance: () => void;
  onTryAgain?: () => void;
}

export function ThreadedMCQ({ question, options, onSubmitAttempt, feedback, onAdvance, onTryAgain }: ThreadedMCQProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedIdx === null) return;
    setIsSubmitting(true);
    await onSubmitAttempt(selectedIdx);
    setIsSubmitting(false);
  };

  const isCorrect = feedback?.correct;

  // We map the options to the format MultipleChoice expects
  const mcqOptions = options.map((optText, idx) => ({
    id: idx.toString(),
    text: optText
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
          selectedValue={selectedIdx !== null ? selectedIdx.toString() : ""}
          onChange={(id) => { if (!feedback && !isSubmitting) setSelectedIdx(parseInt(id)); }}
        />
        
        {!feedback && (
          <button 
            onClick={handleSubmit}
            disabled={selectedIdx === null || isSubmitting}
            className="self-end bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Answer"}
          </button>
        )}
      </div>

      {/* Feedback Result */}
      <AnimatePresence>
        {feedback && (
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
              
              {feedback.explanation && (
                <p className="text-[15px] text-[#c6c5d5] leading-relaxed">
                  {feedback.explanation}
                </p>
              )}

              <button 
                onClick={async () => {
                  const action = isCorrect ? onAdvance : (onTryAgain || onAdvance);
                  if (action.constructor.name === "AsyncFunction" || action.toString().includes("await")) {
                    setIsSubmitting(true);
                    try { await action(); } finally { setIsSubmitting(false); }
                  } else {
                    action();
                  }
                }}
                disabled={isSubmitting}
                className="mt-3 self-start bg-[#2a292f] text-white border border-[#464553] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#35343a] transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && isCorrect && <Loader2 size={16} className="animate-spin" />}
                {isCorrect ? (isSubmitting ? "Loading..." : "Continue Lesson") : "Try Again"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
