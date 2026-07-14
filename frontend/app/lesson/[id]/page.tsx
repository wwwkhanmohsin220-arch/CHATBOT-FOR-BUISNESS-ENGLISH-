"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { ThreadedTheory } from "@/components/lesson/ThreadedTheory";
import { InteractiveQnA } from "@/components/lesson/InteractiveQnA";
import { ThreadedVoice } from "@/components/lesson/ThreadedVoice";
import { ThreadedMCQ } from "@/components/lesson/ThreadedMCQ";
import { QnADrawer } from "@/components/lesson/QnADrawer";
import { TargetedFixCard } from "@/components/lesson/TargetedFixCard";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import Aurora from "@/components/ui/Aurora";

type BlockType = "theory" | "mcq" | "writing" | "voice" | "targeted_fix";

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
  const [isCompiling, setIsCompiling] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;

  const instanceId = params.id as string;
  const { data: rawCurriculum } = useCachedFetch("/api/curriculum");

  let computedUnitTitle = "Loading...";
  let computedLessonTitle = "Loading...";

  if (rawCurriculum?.units) {
    for (const unit of rawCurriculum.units) {
      const lesson = unit.lessons.find((l: any) => l.id === instanceId);
      if (lesson) {
        const unitNumMatch = unit.title.match(/Unit (\d+)/i);
        const unitNum = unitNumMatch ? `Unit ${unitNumMatch[1]}` : "Unit";
        
        const lessonNumMatch = lesson.title.match(/Lesson (\d+)/i);
        const lessonNum = lessonNumMatch ? `Lesson ${lessonNumMatch[1]}` : "Lesson";

        computedUnitTitle = `${unitNum} › ${lessonNum}`;
        computedLessonTitle = lesson.title.includes(":") ? lesson.title.split(": ")[1] : lesson.title;
        break;
      }
    }
  }

  // 1. Fetch current node on mount
  const fetchCurrentNode = async () => {
    try {
      const res = await fetch(`/api/lesson-instances/${instanceId}/nodes/current`, {
        cache: "no-store"
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch node: ${res.status}`);
        if (res.status === 404) {
          router.push("/learn"); // lesson not found - go to curriculum
        } else if (res.status === 503) {
          // Supabase is waking up from sleep — retry instead of redirecting
          setIsCompiling(true);
          setRetryCount(prev => {
            const next = prev + 1;
            if (next >= MAX_RETRIES) {
              router.push("/home");
            } else {
              setTimeout(fetchCurrentNode, 3000);
            }
            return next;
          });
        } else {
          router.push("/home");
        }
        return;
      }

      // Reset retry count on success
      setRetryCount(0);

      const data = await res.json();
      
      if (data.status === "already_completed") {
        setIsAlreadyCompleted(true);
        setIsLoadingInitial(false);
        return;
      }

      if (data.status === "completed") {
        endLesson();
        return;
      }

      if (data.status === "compiling") {
        setIsCompiling(true);
        setTimeout(fetchCurrentNode, 2000);
        return;
      }
      
      // If we got a node, stop compiling state
      setIsCompiling(false);
      
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

      const res = await fetch(`/api/lesson-instances/${instanceId}/nodes/${nodeId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
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
      }
      return data;

    } catch (error) {
      console.error("Error submitting attempt:", error);
    }
  };

  const handleAskExample = () => {
    window.dispatchEvent(new CustomEvent('open-qna-drawer', { detail: { question: "Can you give me an example?" } }));
  };

  const advanceNextBlock = () => {
    // For MCQ, once they click continue after reviewing feedback
    fetchCurrentNode();
  };

  const endLesson = async () => {
    setIsGrading(true);
    try {
      await fetch(`/api/lesson-instances/${instanceId}/complete`, { method: "POST" });
      router.push(`/lesson/complete?instanceId=${instanceId}`);
    } catch (error) {
      console.error("Failed to complete lesson", error);
      setIsGrading(false);
    }
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
            examplePhrase={block.content?.example_phrase || block.content?.example}
            onSubmitAttempt={async () => {
              const data = await submitAttempt(block.node_id);
              if (data?.correct) {
                await fetchCurrentNode();
              }
            }}
          />
        )}
        
        {block.type === "mcq" && (
          <ThreadedMCQ 
            question={block.content.question}
            options={block.content.options}
            onSubmitAttempt={async (idx) => {
              const data = await submitAttempt(block.node_id, idx);
              // We handle next steps in onAdvance or Try Again
            }}
            feedback={feedbacks[block.node_id]}
            onAdvance={async () => {
              // Check if it was correct
              const f = feedbacks[block.node_id];
              if (f?.correct) {
                await fetchCurrentNode();
              }
            }}
            onTryAgain={() => {
              // Clear feedback so they can try again
              setFeedbacks(prev => {
                const next = { ...prev };
                delete next[block.node_id];
                return next;
              });
            }}
          />
        )}

        {block.type === "targeted_fix" && (
           <TargetedFixCard 
             content={block.content as any}
             onSubmitAttempt={async (idx) => {
               const data = await submitAttempt(block.node_id, idx);
               // We handle next steps in onAdvance or Try Again
             }}
             feedback={feedbacks[block.node_id]}
             onAdvance={async () => {
               const f = feedbacks[block.node_id];
               if (f?.correct) {
                 await fetchCurrentNode();
               }
             }}
             onTryAgain={() => {
               setFeedbacks(prev => {
                 const next = { ...prev };
                 delete next[block.node_id];
                 return next;
               });
             }}
           />
        )}

        {block.type === "writing" && (
           <InteractiveQnA
             question={block.content?.prompt || block.content?.scenario || block.content?.text || "Please write a draft."}
             onSubmitDraft={async (draft: string) => {
               const res = await fetch(`/api/lesson-instances/${instanceId}/writing/submit`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ draft })
               });
               if (!res.ok) {
                 throw new Error("Failed to submit draft");
               }
               const data = await res.json();
               return data.rubric;
             }}
             onComplete={async () => {
                await fetchCurrentNode();
             }}
           />
        )}

        {block.type === "voice" && (
          <ThreadedVoice 
            instanceId={instanceId} 
            nodeId={block.node_id} 
            content={block.content}
            onEndSession={endLesson}
          />
        )}
      </motion.div>
    );
  };

  if (isLoadingInitial || isCompiling) {
     return (
       <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center text-white gap-4 relative overflow-hidden">
         <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
            <Aurora
              colorStops={["#4f46e5", "#818CF8", "#0EA5E9"]}
              blend={0.5}
              amplitude={1.5}
              speed={isCompiling ? 1.8 : 0.6}
            />
         </div>
         <div className="z-10 flex flex-col items-center">
           <div className="w-16 h-16 border-4 border-[#818cf8] border-t-transparent rounded-full animate-spin mb-4" />
           <h2 className="text-[24px] font-bold text-white shadow-sm">
             {isCompiling ? "Personalizing your lesson..." : "Loading Lesson..."}
           </h2>
           <p className="text-[#A0A0AB] mt-2 drop-shadow-md font-medium">AI is assembling real-world business scenarios</p>
         </div>
       </div>
     );
  }

  if (isAlreadyCompleted) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans relative overflow-hidden items-center justify-center">
        {/* Background Geometrics */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-[0.03] text-white">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.1" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 flex flex-col items-center text-center max-w-[500px] px-6 gap-6"
        >
          <div className="w-16 h-16 bg-[#131318] border border-[#242430] rounded-2xl flex items-center justify-center text-[#818CF8]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div>
            <h2 className="text-[28px] font-bold text-white mb-2">Lesson Completed</h2>
            <p className="text-[16px] text-[#A0A0AB]">You've already finished this lesson. What would you like to do next?</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
            <button 
              onClick={() => router.push(`/lesson/complete?instanceId=${instanceId}`)}
              className="w-full sm:flex-1 min-h-[48px] rounded-[10px] bg-[#242430] text-white text-[14px] font-semibold hover:bg-[#2a2a35] transition-colors flex items-center justify-center"
            >
              View Report Card
            </button>
            <button 
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  const res = await fetch(`/api/lesson-instances/${instanceId}`, { method: "DELETE" });
                  if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Delete failed with status: ${res.status}. Body: ${text}`);
                  }
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  setIsDeleting(false);
                }
              }}
              className="w-full sm:flex-1 min-h-[48px] rounded-[10px] bg-[#818CF8] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              )}
              Retry Lesson
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans">
      <LessonHeader 
        unitTitle={computedUnitTitle} 
        lessonTitle={computedLessonTitle}
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

      <QnADrawer instanceId={instanceId} />
    </div>
  );
}
