"use client";

import { useState, useEffect } from "react";
import { Bot, Lightbulb, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ThreadedTheoryProps {
  content: string;
  examplePhrase?: string;
  onSubmitAttempt: () => Promise<void>;
}

export function ThreadedTheory({ content, examplePhrase, onSubmitAttempt }: ThreadedTheoryProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExample, setShowExample] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    setIsTyping(true);
    setDisplayedText("");
    
    const intervalId = setInterval(() => {
      setDisplayedText(content.substring(0, i + 1));
      i++;
      if (i >= content.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 20); // 20ms per character

    return () => clearInterval(intervalId);
  }, [content]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmitAttempt();
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6 w-full"
    >
      <div className="flex gap-4 items-start pl-4 border-l-[3px] border-[#818cf8]">
        <div className="w-10 h-10 rounded-full bg-[#2a292f] flex items-center justify-center shrink-0 border border-[#35343a] shadow-[0_0_15px_rgba(129,140,248,0.15)]">
          <Bot size={20} className="text-[#818cf8]" />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[12px] font-medium text-[#c6c5d5] uppercase tracking-wider">AI Coach</span>
          <p className="text-[18px] leading-8 text-[#e4e1e9] font-medium">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-[8px] h-[18px] bg-[#818cf8] ml-1 animate-pulse" />
            )}
          </p>
        </div>
      </div>

      {showExample && examplePhrase && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 items-start pl-4 ml-8 border-l-[3px] border-[#818cf8]/50 mt-4"
        >
          <div className="flex flex-col gap-1 w-full bg-[#818cf8]/10 p-4 rounded-xl border border-[#818cf8]/20">
            <span className="text-[12px] font-medium text-[#c6c5d5] uppercase tracking-wider">Example</span>
            <p className="text-[16px] leading-7 text-[#e4e1e9] italic">
              "{examplePhrase}"
            </p>
          </div>
        </motion.div>
      )}

      {!isTyping && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end gap-3 mt-4"
        >
          {!showExample && examplePhrase && (
            <button 
              onClick={() => setShowExample(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[#818cf8] border border-[#818cf8] hover:bg-[#818cf8]/10 transition-colors text-[14px] font-semibold disabled:opacity-50"
            >
              <Lightbulb size={16} />
              Give me an example
            </button>
          )}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Got it, let's practice"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
