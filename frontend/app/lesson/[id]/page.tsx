"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { ThreadedTheory } from "@/components/lesson/ThreadedTheory";
import { InteractiveQnA } from "@/components/lesson/InteractiveQnA";
import { ThreadedVoice } from "@/components/lesson/ThreadedVoice";
import { ThreadedMCQ } from "@/components/lesson/ThreadedMCQ";

// The new Dynamic Block Architecture
type BlockType = "theory" | "mcq" | "qna" | "voice";

interface LessonBlock {
  id: string;
  type: BlockType;
  content?: string;
  question?: string;
  options?: { id: string; text: string; isCorrect?: boolean; explanation?: string }[];
}

const MOCK_BLOCKS: LessonBlock[] = [
  {
    id: "b1",
    type: "theory",
    content: "Directly saying 'I disagree' or 'You're wrong' can be interpreted as aggressive in many English-speaking business cultures. Let's learn how to express opposition constructively and professionally."
  },
  {
    id: "b2",
    type: "mcq",
    question: "Which of these phrases is the most professional way to disagree?",
    options: [
      { id: "o1", text: "I think you're totally wrong about the budget.", isCorrect: false, explanation: "This is too direct and confrontational." },
      { id: "o2", text: "I see where you're coming from, but I wonder if we might need more budget for marketing.", isCorrect: true, explanation: "Excellent! This acknowledges their point before proposing an alternative." },
      { id: "o3", text: "No, that budget won't work for us.", isCorrect: false, explanation: "This lacks mitigation and sounds blunt." }
    ]
  },
  {
    id: "b3",
    type: "theory",
    content: "Great job! Using softer language (mitigation) helps preserve relationships while still making your point clear. Phrases like 'I'm not sure I agree' or 'What if we considered' are great tools."
  },
  {
    id: "b4",
    type: "qna",
    question: "Your manager just suggested launching the new feature next week. You think it needs at least two more weeks of testing. How would you reply using mitigating language?"
  },
  {
    id: "b5",
    type: "voice"
  }
];

export default function UnifiedLessonPage() {
  const params = useParams();
  const router = useRouter();
  
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [isGrading, setIsGrading] = useState(false);

  const progress = Math.min(100, Math.round(((currentBlockIndex) / MOCK_BLOCKS.length) * 100));

  const handleAskExample = () => {
    console.log("User asked for an example.");
  };

  const advanceNextBlock = () => {
    if (currentBlockIndex < MOCK_BLOCKS.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    }
  };

  const endLesson = () => {
    setIsGrading(true);
    // Usually we would redirect to the report card here
    setTimeout(() => {
      router.push('/lesson/complete');
    }, 1500);
  };

  // Render a specific block
  const renderBlock = (block: LessonBlock, index: number) => {
    const isActive = index === currentBlockIndex;
    const isPast = index < currentBlockIndex;
    
    // Only render blocks that are active or past
    if (index > currentBlockIndex) return null;

    return (
      <motion.div
        key={block.id}
        layout
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: isActive ? 1 : 0.4, y: 0 }}
        className="w-full relative"
      >
        {/* Thread connector line for all but the first block */}
        {index > 0 && (
          <div className="absolute -top-12 left-9 w-[2px] h-12 bg-[#242430]" />
        )}

        {block.type === "theory" && (
          <ThreadedTheory 
            content={block.content || ""}
            onComplete={advanceNextBlock}
            onAskExample={handleAskExample}
          />
        )}
        
        {block.type === "mcq" && (
          <ThreadedMCQ
            question={block.question || ""}
            options={block.options || []}
            onComplete={advanceNextBlock}
          />
        )}

        {block.type === "qna" && (
          <InteractiveQnA 
            question={block.question || ""}
            onComplete={advanceNextBlock}
          />
        )}

        {block.type === "voice" && (
          <ThreadedVoice onEndSession={endLesson} />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans">
      <LessonHeader 
        unitTitle="Unit 3 › Lesson 4" 
        lessonTitle="Disagreeing Politely"
        progress={progress}
      />
      
      <main className="flex-1 w-full max-w-[800px] mx-auto pt-[84px] pb-[64px] px-6 md:px-0 flex flex-col gap-12 relative overflow-x-hidden">
        
        <AnimatePresence mode="popLayout">
          {!isGrading ? (
            <>
              {MOCK_BLOCKS.map((block, index) => renderBlock(block, index))}
            </>
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-[400px] flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-16 h-16 border-4 border-[#818cf8] border-t-transparent rounded-full animate-spin mb-4" />
              <h2 className="text-[24px] font-bold text-white">AI Coach is grading your session...</h2>
              <p className="text-[#A0A0AB]">Generating your personalized Session Report Card</p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
