"use client";

import { useState, useEffect } from "react";
import { Bot, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface ThreadedTheoryProps {
  content: string;
  onComplete: () => void;
  onAskExample: () => void;
}

export function ThreadedTheory({ content, onComplete, onAskExample }: ThreadedTheoryProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

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

      {!isTyping && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end gap-3 mt-4"
        >
          <button 
            onClick={onAskExample}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[#818cf8] border border-[#818cf8] hover:bg-[#818cf8]/10 transition-colors text-[14px] font-semibold"
          >
            <Lightbulb size={16} />
            Give me an example
          </button>
          
          <button 
            onClick={onComplete}
            className="bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-6 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center active:scale-95"
          >
            Got it, let's practice
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
