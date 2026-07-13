"use client";

import { useState } from "react";
import { Bot, CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MultipleChoice } from "./MultipleChoice";

interface TargetedFixProps {
  content: {
    text: string;
    micro_theory: string;
    drill_mcq: {
      question: string;
      options: string[];
    };
  };
  onSubmitAttempt: (answerIndex: number) => Promise<void>;
  feedback: { correct: boolean; explanation?: string } | null;
  onAdvance: () => void;
  onTryAgain?: () => void;
}

export function TargetedFixCard({ content, onSubmitAttempt, feedback, onAdvance, onTryAgain }: TargetedFixProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleSubmit = async () => {
    if (selectedIdx === null) return;
    setIsSubmitting(true);
    await onSubmitAttempt(selectedIdx);
    setIsSubmitting(false);
  };

  const isCorrect = feedback?.correct;

  // Ensure options exists before mapping
  const options = content?.drill_mcq?.options || [];
  const mcqOptions = options.map((optText, idx) => ({
    id: idx.toString(),
    text: optText
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex flex-col gap-6 w-full p-6 rounded-[20px] bg-gradient-to-b from-[#818cf8]/10 to-transparent border border-[#818cf8]/30 shadow-[0_0_30px_rgba(129,140,248,0.1)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#818cf8] to-[#c7d2fe]" />
      
      {/* Badge */}
      <div className="flex items-center gap-2 self-start bg-[#818cf8]/20 text-[#818cf8] px-3 py-1.5 rounded-full border border-[#818cf8]/30">
        <Zap size={14} className="fill-current" />
        <span className="text-[12px] font-bold uppercase tracking-wider">AI Coach</span>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
          {content?.text}
        </p>
        <div className="p-4 bg-[#2a292f] rounded-[12px] border border-[#35343a] border-l-[4px] border-l-[#818cf8]">
          <p className="text-[15px] text-[#c6c5d5] italic">
            "{content?.micro_theory}"
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-[15px] font-semibold text-white">{content?.drill_mcq?.question}</h3>
        <MultipleChoice 
          name={`mcq-fix`}
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
            className="overflow-hidden"
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
                  {isCorrect ? "Nailed it!" : "Not quite right."}
                </span>
              </div>
              
              {feedback.explanation && (
                <p className="text-[15px] text-[#c6c5d5] leading-relaxed">
                  {feedback.explanation}
                </p>
              )}

              <button 
                onClick={async () => {
                  if (isCorrect) {
                    setIsAdvancing(true);
                    try { await onAdvance(); } finally { setIsAdvancing(false); }
                  } else {
                    (onTryAgain || onAdvance)();
                  }
                }}
                disabled={isAdvancing}
                className="mt-3 self-start bg-[#2a292f] text-white border border-[#464553] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#35343a] transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdvancing && isCorrect && <Loader2 size={16} className="animate-spin" />}
                {isCorrect ? (isAdvancing ? "Loading..." : "Continue Lesson") : "Try Again"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
