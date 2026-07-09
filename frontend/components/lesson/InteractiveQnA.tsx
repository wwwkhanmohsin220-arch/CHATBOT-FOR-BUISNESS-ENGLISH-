"use client";

import { useState } from "react";
import { Bot, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InteractiveQnAProps {
  question: string;
  onComplete: () => void;
}

type FeedbackState = "idle" | "grading" | "result";

export function InteractiveQnA({ question, onComplete }: InteractiveQnAProps) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<FeedbackState>("idle");
  const [feedback, setFeedback] = useState<{
    score: number;
    color: "green" | "yellow" | "red";
    message: string;
    details: string;
  } | null>(null);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    
    setState("grading");
    
    // Mock the backend grading delay
    setTimeout(() => {
      // For prototype purposes, we will return a "Yellow" partial credit response
      setFeedback({
        score: 75,
        color: "yellow",
        message: "Good start, but could be more professional.",
        details: "You expressed the right idea, but using phrases like 'I think that's bad' is a bit too direct for this context. Try mitigating it with 'I have some concerns about...'"
      });
      setState("result");
    }, 1500);
  };

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
          <span className="text-[12px] font-medium text-[#c6c5d5] uppercase tracking-wider">Coach Question</span>
          <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="pl-14 flex flex-col gap-3">
        <textarea 
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={state !== "idle"}
          className="w-full bg-[#1c1c23] border border-[#242430] rounded-[10px] p-4 text-[16px] text-[#e4e1e9] placeholder:text-[#52525B] focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] outline-none transition-colors resize-y min-h-[120px] disabled:opacity-50" 
          placeholder="Type your response here..."
        />
        
        {state === "idle" && (
          <button 
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="self-end bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            Submit Answer
            <Send size={16} />
          </button>
        )}

        {state === "grading" && (
          <div className="self-end flex items-center gap-3 text-[#818cf8] py-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-[14px] font-medium">Coach is grading...</span>
          </div>
        )}
      </div>

      {/* Feedback Result */}
      <AnimatePresence>
        {state === "result" && feedback && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="pl-14 overflow-hidden"
          >
            <div className={`mt-2 rounded-[14px] p-5 border flex flex-col gap-3
              ${feedback.color === "green" ? "bg-green-500/10 border-green-500/30" : ""}
              ${feedback.color === "yellow" ? "bg-yellow-500/10 border-yellow-500/30" : ""}
              ${feedback.color === "red" ? "bg-red-500/10 border-red-500/30" : ""}
            `}>
              <div className="flex items-center gap-2">
                {feedback.color === "green" ? (
                  <CheckCircle2 size={20} className="text-green-400" />
                ) : (
                  <AlertCircle size={20} className={feedback.color === "yellow" ? "text-yellow-400" : "text-red-400"} />
                )}
                <span className={`text-[15px] font-semibold tracking-wide
                  ${feedback.color === "green" ? "text-green-400" : ""}
                  ${feedback.color === "yellow" ? "text-yellow-400" : ""}
                  ${feedback.color === "red" ? "text-red-400" : ""}
                `}>
                  {feedback.message}
                </span>
                <span className="ml-auto text-[14px] font-bold text-white/50">{feedback.score}/100</span>
              </div>
              
              <p className="text-[15px] text-[#c6c5d5] leading-relaxed">
                {feedback.details}
              </p>

              <button 
                onClick={onComplete}
                className="mt-3 self-start bg-[#2a292f] text-white border border-[#464553] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#35343a] transition-colors active:scale-95"
              >
                Continue to Voice Practice
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
