"use client";

import { useState, useEffect } from "react";
import { Mic, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Strands from "@/components/ui/Strands";

interface Message {
  id: string;
  sender: "Coach" | "You";
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "Coach",
    text: "Let's start with a common negotiation scenario. You're discussing the Q3 marketing budget with your team lead.",
  },
];

const MOCK_CONVERSATION: Message[] = [
  {
    id: "m2",
    sender: "You",
    text: "I think we should allocate more resources to digital channels this quarter.",
  },
  {
    id: "m3",
    sender: "Coach",
    text: "That's a good start. How would you justify that recommendation to the CFO?",
  },
  {
    id: "m4",
    sender: "You",
    text: "Because digital channels have shown a 20% higher ROI compared to traditional media over the last six months.",
  },
  {
    id: "m5",
    sender: "Coach",
    text: "Excellent use of data. Remember to also mention the specific timeline for seeing those returns.",
  }
];

interface ThreadedVoiceProps {
  onEndSession: () => void;
}

export function ThreadedVoice({ onEndSession }: ThreadedVoiceProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isRecording, setIsRecording] = useState(false);

  // Simulate incoming messages for demonstration
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < MOCK_CONVERSATION.length) {
        const nextMsg = MOCK_CONVERSATION[index];
        setMessages((prev) => [...prev, nextMsg]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 4000); // New message every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Show only the last 3 messages so we don't overflow, but let container height be dynamic
  const visibleMessages = messages.slice(-3);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Intro Context */}
      <div className="flex gap-4 items-start pl-4 border-l-[3px] border-[#818cf8]">
        <div className="w-10 h-10 rounded-full bg-[#2a292f] flex items-center justify-center shrink-0 border border-[#35343a]">
          <Bot size={20} className="text-[#818cf8]" />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[12px] font-medium text-[#c6c5d5] uppercase tracking-wider">Voice Practice</span>
          <p className="text-[16px] text-[#e4e1e9] font-medium leading-relaxed">
            Ready to speak? Tap the mic when you're ready to start the roleplay.
          </p>
        </div>
      </div>

      {/* Voice Interface aligned with the thread */}
      <div className="pl-14 w-full flex flex-col items-center gap-8">
        
        {/* Voice Visualizer */}
        <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-full overflow-hidden shrink-0 mt-4">
          <div className="absolute inset-0 w-full h-full">
            <Strands
              colors={["#818CF8", "#0EA5E9"]}
              count={25}
              speed={0.5}
              amplitude={1.2}
              waviness={1.5}
              thickness={0.5}
              glow={2.5}
              taper={2}
              spread={1.8}
              intensity={0.8}
              saturation={1.5}
              opacity={1}
              scale={1.2}
              glass={false}
            />
          </div>
          <div className="absolute inset-0 rounded-full border border-[#818CF8]/30 shadow-[0_0_40px_rgba(129,140,248,0.2)] pointer-events-none" />
        </div>

        {/* Auto-Scrolling Transcript Area - Fixed overflow issue by allowing dynamic height */}
        <div className="w-full max-w-[600px] flex flex-col justify-end min-h-[120px]">
          <div className="w-full flex flex-col gap-6 px-2">
            <AnimatePresence initial={false}>
              {visibleMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-col gap-1 w-full shrink-0"
                >
                  <span 
                    className={
                      msg.sender === "Coach" 
                        ? "text-[#818cf8] text-[12px] font-bold tracking-wide uppercase" 
                        : "text-[#A0A0AB] text-[12px] font-bold tracking-wide uppercase"
                    }
                  >
                    {msg.sender}
                  </span>
                  <p className="text-[#e4e1e9] text-[16px] md:text-[18px] leading-relaxed font-medium">
                    {msg.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 mt-4 w-full">
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-3 px-8 h-[56px] rounded-full transition-all group active:scale-95 border-2
              ${isRecording 
                ? "bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-400 hover:border-red-400" 
                : "bg-[#818cf8] border-[#818cf8] text-[#0A0A0F] shadow-[0_0_20px_rgba(129,140,248,0.2)] hover:bg-[#bdc2ff] hover:border-[#bdc2ff]"
              }
            `}
          >
            <Mic 
              size={22} 
              className={`transition-transform ${isRecording ? "animate-pulse" : "group-hover:scale-110"}`} 
              fill="currentColor" 
            />
            <span className="text-[15px] font-bold tracking-wide">
              {isRecording ? "Listening..." : "Tap to speak"}
            </span>
          </button>
          
          <button 
            onClick={onEndSession}
            className="text-[#908f9e] hover:text-white transition-colors text-[14px] font-semibold mt-4"
          >
            End Session & Grade
          </button>
        </div>

      </div>
    </motion.div>
  );
}
