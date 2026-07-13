"use client";

import { useState } from "react";
import { Bot, CheckCircle2, AlertCircle, Sparkles, MessageSquare, Target, AlignLeft, Send, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface WritingRubric {
  tone: { score: number; explanation: string };
  clarity: { score: number; explanation: string };
  structure: { score: number; explanation: string };
  overall_comment: string;
  suggested_rewrite: string;
  detected_concept_errors: string[];
}

interface InteractiveQnAProps {
  question: string;
  onSubmitDraft: (draft: string) => Promise<WritingRubric>;
  onComplete: () => void;
}

type FeedbackState = "idle" | "grading" | "result";

export function InteractiveQnA({ question, onSubmitDraft, onComplete }: InteractiveQnAProps) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<FeedbackState>("idle");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [rubric, setRubric] = useState<WritingRubric | null>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setState("grading");
    try {
      const result = await onSubmitDraft(answer);
      setRubric(result);
      setState("result");
    } catch (err) {
      console.error(err);
      setState("idle");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-pink-400";
  };

  const overallAvg = rubric ? Math.round(((rubric.tone.score + rubric.clarity.score + rubric.structure.score) / 3) * 10) : 0;
  const overallColor = getScoreColor(overallAvg / 10);
  const overallBg = overallAvg >= 80 ? "bg-green-500/10 border-green-500/30" : overallAvg >= 60 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-pink-500/10 border-pink-500/30";

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* The Question */}
      <div className="flex gap-4 items-start pl-4 border-l-[3px] border-[#818cf8]">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#818cf8]/20 to-[#c7d2fe]/10 flex items-center justify-center shrink-0 border border-[#818cf8]/30">
          <Bot size={20} className="text-[#818cf8]" />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[12px] font-bold text-[#818cf8] uppercase tracking-wider">Writing Assessment</span>
          <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="pl-[56px] flex flex-col gap-3">
        <textarea 
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={state !== "idle"}
          className="w-full bg-[#131318] border border-[#242430] rounded-[16px] p-4 text-[16px] text-[#e4e1e9] placeholder:text-[#52525B] focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] outline-none transition-colors resize-y min-h-[120px] disabled:opacity-50" 
          placeholder="Draft your response here..."
        />
        
        {state === "idle" && (
          <button 
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="self-end bg-[#e4e1e9] text-[#0A0A0F] text-[14px] font-semibold h-[44px] px-6 rounded-[12px] hover:bg-white transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            Submit for AI Review
            <Sparkles size={16} />
          </button>
        )}

        {state === "grading" && (
          <div className="self-end flex items-center justify-center gap-3 text-[#818cf8] bg-[#818cf8]/10 px-6 h-[44px] rounded-[12px] border border-[#818cf8]/30">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-[14px] font-semibold">Coach is grading...</span>
          </div>
        )}
      </div>

      {/* Feedback Result */}
      <AnimatePresence>
        {state === "result" && rubric && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pl-[56px] overflow-hidden flex flex-col gap-4"
          >
            {/* Overall Score Card */}
            <div className={`rounded-[16px] p-5 border flex flex-col gap-3 shadow-lg ${overallBg}`}>
              <div className="flex items-center gap-3">
                {overallAvg >= 80 ? (
                  <CheckCircle2 size={24} className={overallColor} />
                ) : (
                  <AlertCircle size={24} className={overallColor} />
                )}
                <span className={`text-[18px] font-bold tracking-wide ${overallColor}`}>
                  {overallAvg >= 80 ? "Great Draft!" : "Needs Polish"}
                </span>
                <span className="ml-auto text-[24px] font-black text-white/90">{overallAvg}<span className="text-[14px] text-white/50">/100</span></span>
              </div>
              
              <p className="text-[15px] text-[#e4e1e9] leading-relaxed font-medium">
                {rubric.overall_comment}
              </p>
            </div>

            {/* Rubric Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "Tone", score: rubric.tone.score, exp: rubric.tone.explanation, icon: MessageSquare },
                { label: "Clarity", score: rubric.clarity.score, exp: rubric.clarity.explanation, icon: Target },
                { label: "Structure", score: rubric.structure.score, exp: rubric.structure.explanation, icon: AlignLeft }
              ].map(axis => (
                <div key={axis.label} className="bg-[#1c1c23] border border-[#242430] p-4 rounded-[12px] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#a0a0ab]">
                      <axis.icon size={14} />
                      <span className="text-[12px] font-bold uppercase tracking-wider">{axis.label}</span>
                    </div>
                    <span className={`text-[14px] font-bold ${getScoreColor(axis.score)}`}>{axis.score}/10</span>
                  </div>
                  <p className="text-[13px] text-[#c6c5d5] leading-relaxed">{axis.exp}</p>
                </div>
              ))}
            </div>

            {/* Suggested Rewrite */}
            {overallAvg < 100 && rubric.suggested_rewrite && (
              <div className="bg-gradient-to-r from-[#2a292f] to-[#1c1c23] border border-[#35343a] p-5 rounded-[16px] flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={64} className="text-[#818cf8]" />
                </div>
                <span className="text-[12px] font-bold text-[#818cf8] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} />
                  Suggested Rewrite
                </span>
                <p className="text-[15px] text-[#e4e1e9] italic leading-relaxed z-10 relative">
                  "{rubric.suggested_rewrite}"
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-2 self-start">
              {overallAvg < 60 && (
                <button 
                  onClick={() => {
                    setAnswer("");
                    setState("idle");
                    setRubric(null);
                  }}
                  className="bg-transparent text-[#e4e1e9] border border-[#35343a] text-[15px] font-bold h-[48px] px-8 rounded-[12px] hover:bg-[#35343a] transition-all active:scale-95 flex items-center gap-2"
                >
                  Try Again
                </button>
              )}
              <button 
                onClick={async () => {
                  setIsAdvancing(true);
                  try {
                    await onComplete();
                  } finally {
                    setIsAdvancing(false);
                  }
                }}
                disabled={isAdvancing}
                className="bg-[#818cf8] text-[#0A0A0F] text-[15px] font-bold h-[48px] px-8 rounded-[12px] hover:bg-[#bdc2ff] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(129,140,248,0.2)] disabled:opacity-50"
              >
                {isAdvancing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue Lesson
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
