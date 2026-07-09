"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Bookmark, ArrowRight, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SRS_TERMS = [
  {
    id: "1",
    term: "Mitigation",
    phonetic: "/ˌmɪtɪˈɡeɪʃən/",
    definition: "The action of reducing the severity, seriousness, or painfulness of something.",
    context: "We need a mitigation strategy in case the server launch fails."
  },
  {
    id: "2",
    term: "Deliverable",
    phonetic: "/dɪˈlɪv(ə)rəb(ə)l/",
    definition: "A thing able to be provided, especially as a product of a development process.",
    context: "The final deliverable is due by end of day Friday."
  },
  {
    id: "3",
    term: "Bandwidth",
    phonetic: "/ˈbændwɪdθ/",
    definition: "The energy or mental capacity required to deal with a situation.",
    context: "I don't have the bandwidth to take on another project this sprint."
  }
];

export default function SRSReviewPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentTerm = SRS_TERMS[currentIndex];
  const progress = ((currentIndex) / SRS_TERMS.length) * 100;

  const handleNext = (status: "learning" | "mastered") => {
    if (currentIndex < SRS_TERMS.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-[28px] font-bold text-white mb-2">Review Complete!</h1>
        <p className="text-[#908f9e] mb-8 text-center max-w-sm">
          You've successfully completed your daily Business Lexicon spaced repetition.
        </p>
        <button 
          onClick={() => router.push('/home')}
          className="h-12 px-8 rounded-[10px] bg-[#818CF8] text-[#0A0A0F] text-[15px] font-bold hover:bg-[#bdc2ff] transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans">
      
      {/* Header & Progress */}
      <header className="h-[64px] border-b border-[#1A1A22] px-6 flex items-center gap-6 sticky top-0 bg-[#0A0A0F]/80 backdrop-blur-md z-10">
        <button 
          onClick={() => router.push('/home')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1A1A22] transition-colors text-[#908f9e]"
        >
          <ArrowLeft size={18} />
        </button>
        
        <div className="flex-1 max-w-[600px] mx-auto flex items-center gap-4">
          <div className="flex-1 h-2 bg-[#242430] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#818CF8] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[14px] font-semibold text-[#818CF8] whitespace-nowrap">
            {currentIndex + 1} / {SRS_TERMS.length}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[600px] mx-auto p-6 flex flex-col justify-center gap-8 relative">
        
        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTerm.id + (isFlipped ? "-back" : "-front")}
            initial={{ opacity: 0, rotateY: isFlipped ? -90 : 90, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: isFlipped ? 90 : -90, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-full aspect-[4/3] bg-[#131318] border border-[#242430] rounded-[24px] shadow-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden"
          >
            {/* Card Background Decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>

            {!isFlipped ? (
              // FRONT
              <div className="text-center z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#818CF8]/10 text-[#818CF8] flex items-center justify-center mb-6">
                  <Bookmark size={24} />
                </div>
                <h2 className="text-[40px] md:text-[56px] font-bold text-white tracking-tight leading-none mb-2">
                  {currentTerm.term}
                </h2>
              </div>
            ) : (
              // BACK
              <div className="text-left w-full z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[32px] font-bold text-white leading-none">
                      {currentTerm.term}
                    </h2>
                    <button className="w-10 h-10 rounded-full hover:bg-[#242430] flex items-center justify-center text-[#908f9e] transition-colors">
                      <Volume2 size={20} />
                    </button>
                  </div>
                  <span className="text-[16px] text-[#818CF8] font-mono tracking-wide block mb-8">
                    {currentTerm.phonetic}
                  </span>
                  
                  <div className="mb-6">
                    <h3 className="text-[13px] uppercase tracking-wider text-[#908f9e] font-semibold mb-2">Definition</h3>
                    <p className="text-[18px] text-[#e4e1e9] leading-relaxed">
                      {currentTerm.definition}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-[13px] uppercase tracking-wider text-[#908f9e] font-semibold mb-2">In Context</h3>
                    <div className="bg-[#1c1c23] border border-[#242430] rounded-xl p-4">
                      <p className="text-[15px] italic text-[#c6c5d5]">
                        "{currentTerm.context}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 h-[56px]">
          {!isFlipped ? (
            <button 
              onClick={() => setIsFlipped(true)}
              className="w-full h-full rounded-[14px] bg-[#818CF8] text-[#0A0A0F] text-[16px] font-bold hover:bg-[#bdc2ff] transition-colors active:scale-95"
            >
              Reveal Answer
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleNext("learning")}
                className="flex-1 h-full rounded-[14px] bg-transparent border-2 border-[#F87171] text-[#F87171] text-[16px] font-bold hover:bg-[#F87171]/10 transition-colors active:scale-95"
              >
                Still Learning
              </button>
              <button 
                onClick={() => handleNext("mastered")}
                className="flex-1 h-full rounded-[14px] bg-[#4ADE80] text-[#0A0A0F] text-[16px] font-bold hover:bg-[#86efac] transition-colors active:scale-95"
              >
                Got It
              </button>
            </>
          )}
        </div>

      </main>
    </div>
  );
}
