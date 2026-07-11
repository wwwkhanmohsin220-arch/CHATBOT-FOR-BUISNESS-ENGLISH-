"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState, useEffect } from "react";
import { ArrowLeft, Mic, Keyboard } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function VoicePracticePage() {
  const router = useRouter();
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

  // Show only the last 3 messages so we don't overflow
  const visibleMessages = messages.slice(-3);

  return (
    <div className="h-screen w-full flex flex-col font-sans text-[#e4e1e9] bg-[#0A0A0F] overflow-hidden antialiased selection:bg-[#818cf8] selection:text-[#0A0A0F]">
      
      {/* Top Controls (Fixed) */}
      <header className="w-full h-16 px-6 flex items-center justify-between z-10 shrink-0 border-b border-[#242430]/30">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#A0A0AB] hover:text-white transition-colors text-[14px] font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-bold tracking-widest text-[#5F5F6B] uppercase">Voice Practice</span>
          <span className="text-[#e4e1e9] text-[14px] font-semibold">Meeting Negotiation</span>
        </div>
        <button 
          onClick={() => router.push('/lesson/complete')}
          className="text-[#A0A0AB] hover:text-white transition-colors text-[14px] font-medium"
        >
          End session
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[800px] mx-auto flex flex-col items-center justify-center relative px-6 py-4 overflow-hidden gap-8">
        
        {/* Voice Visualizer (Fixed Size) */}
        <div className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-full overflow-hidden shrink-0 animate-in fade-in duration-700">
          <div className="absolute inset-0 w-full h-full">
            <Strands
              style={{}}
              colors={isRecording ? ["#ef4444", "#f43f5e"] : ["#818CF8", "#0EA5E9"]}
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

        {/* Auto-Scrolling Transcript Area (Fixed Height Viewport) */}
        <div className="w-full max-w-[600px] h-[280px] md:h-[320px] relative overflow-hidden flex flex-col justify-end pb-4">
          
          {/* List of Messages */}
          <div className="w-full flex flex-col justify-end gap-6 px-2">
            <AnimatePresence initial={false}>
              {visibleMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-col gap-1.5 w-full shrink-0"
                >
                  <span 
                    className={
                      msg.sender === "Coach" 
                        ? "text-[#818cf8] text-[13px] font-bold tracking-wide uppercase" 
                        : "text-[#A0A0AB] text-[13px] font-bold tracking-wide uppercase"
                    }
                  >
                    {msg.sender}
                  </span>
                  <p className="text-[#e4e1e9] text-[16px] md:text-[18px] leading-relaxed">
                    {msg.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Bottom Controls (Fixed) */}
      <footer className="w-full h-[100px] shrink-0 bg-[#0A0A0F] border-t border-[#242430]/30 flex flex-col items-center justify-center pb-4 z-20">
        
        {/* Mic Button */}
        <button 
          onClick={() => setIsRecording(!isRecording)}
          className={`flex items-center gap-3 px-8 h-[56px] rounded-full transition-all group active:scale-95 border-2 mt-2
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
        
      </footer>

    </div>
  );
}
