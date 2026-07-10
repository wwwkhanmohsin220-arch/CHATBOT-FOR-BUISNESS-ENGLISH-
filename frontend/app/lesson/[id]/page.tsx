"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { ThreadedTheory } from "@/components/lesson/ThreadedTheory";
import { InteractiveQnA } from "@/components/lesson/InteractiveQnA";
import { ThreadedVoice } from "@/components/lesson/ThreadedVoice";
import { ThreadedMCQ } from "@/components/lesson/ThreadedMCQ";

type BlockType = "theory" | "mcq" | "qna" | "voice" | "targeted_fix";

interface LessonBlock {
  node_id: string;
  type: BlockType;
  concept_tag: string;
  content?: any;
}

export default function UnifiedLessonPage() {
  const params = useParams();
  const router = useRouter();
  
  const [nodes, setNodes] = useState<LessonBlock[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<string, { correct: boolean; explanation?: string }>>({});
  const [isGrading, setIsGrading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Hardcode the instance ID for Phase 1 Mock
  const instanceId = "test"; 

  // 1. Fetch current node on mount
  const fetchCurrentNode = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/lesson-instances/${instanceId}/nodes/current`);
      const data = await res.json();
      
      if (data.status === "completed") {
        endLesson();
        return;
      }
      
      // Append the new node if it doesn't already exist
      setNodes(prev => {
        if (prev.find(n => n.node_id === data.node_id)) return prev;
        return [...prev, data];
      });
    } catch (error) {
      console.error("Error fetching current node:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchCurrentNode();
  }, []);

  // 2. Submit Attempt
  const submitAttempt = async (nodeId: string, answerIndex?: number) => {
    try {
      const payload: any = {};
      if (answerIndex !== undefined) payload.answer_index = answerIndex;
      else payload.read_ack = true;

      const res = await fetch(`http://localhost:8000/api/lesson-instances/${instanceId}/nodes/${nodeId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      // Store feedback so the component can render green/red
      setFeedbacks(prev => ({
        ...prev,
        [nodeId]: { correct: data.correct, explanation: data.explanation }
      }));

      // Update progress bar deterministically based on advance_to (assuming total spine = 5 for mock)
      if (data.advance_to !== undefined) {
        setProgress(Math.min(100, Math.round((data.advance_to / 5) * 100)));
      }

      // If correct, or if it's theory, we automatically fetch the next node to append it
      // For now, we only fetch next if correct so we don't proceed on wrong answers.
      // But we DO append injected nodes if they were returned.
      if (data.injected_node) {
         setNodes(prev => [...prev, data.injected_node]);
      } else if (data.correct) {
         // Only fetch next if we got it right
         await fetchCurrentNode();
      }

    } catch (error) {
      console.error("Error submitting attempt:", error);
    }
  };

  const handleAskExample = () => {
    console.log("User asked for an example. In future, this hits QnA endpoint.");
  };

  const advanceNextBlock = () => {
    // For MCQ, once they click continue after reviewing feedback
    fetchCurrentNode();
  };

  const endLesson = () => {
    setIsGrading(true);
    setTimeout(() => {
      router.push('/lesson/complete');
    }, 1500);
  };

  // Render a specific block
  const renderBlock = (block: LessonBlock, index: number) => {
    // The active block is the last one in the array
    const isActive = index === nodes.length - 1;
    const feedback = feedbacks[block.node_id] || null;

    return (
      <motion.div
        key={`${block.node_id}-${index}`}
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
            content={block.content?.text || ""}
            onSubmitAttempt={() => submitAttempt(block.node_id)}
            onAskExample={handleAskExample}
          />
        )}
        
        {block.type === "mcq" && (
          <ThreadedMCQ
            question={block.content?.question || ""}
            options={block.content?.options || []}
            onSubmitAttempt={(idx) => submitAttempt(block.node_id, idx)}
            feedback={feedback}
            onAdvance={advanceNextBlock}
          />
        )}

        {block.type === "targeted_fix" && (
           <ThreadedTheory 
             content={block.content?.text || "Quick fix: Let's review this concept."}
             onSubmitAttempt={() => submitAttempt(block.node_id)}
             onAskExample={handleAskExample}
           />
        )}

        {block.type === "qna" && (
          <InteractiveQnA 
            question={block.content?.question || ""}
            onComplete={advanceNextBlock}
          />
        )}

        {block.type === "voice" && (
          <ThreadedVoice onEndSession={endLesson} />
        )}
      </motion.div>
    );
  };

  if (isLoadingInitial) {
     return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-white">Loading Lesson...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans">
      <LessonHeader 
        unitTitle="Unit 1 › Lesson 1" 
        lessonTitle="Business Greetings"
        progress={progress}
      />
      
      <main className="flex-1 w-full max-w-[800px] mx-auto pt-[84px] pb-[64px] px-6 md:px-0 flex flex-col gap-12 relative overflow-x-hidden">
        
        <AnimatePresence mode="popLayout">
          {!isGrading ? (
            <>
              {nodes.map((block, index) => renderBlock(block, index))}
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
