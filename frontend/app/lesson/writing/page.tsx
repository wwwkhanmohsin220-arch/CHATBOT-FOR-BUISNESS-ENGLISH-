"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function WritingAssessmentPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submissionState, setSubmissionState] = useState<"draft" | "grading" | "graded">("draft");

  const handleSubmit = () => {
    if (!content.trim()) return;
    setSubmissionState("grading");
    // Simulate AI grading delay
    setTimeout(() => {
      setSubmissionState("graded");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-[64px] border-b border-[#1A1A22] px-6 flex items-center justify-between sticky top-0 bg-[#0A0A0F]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/home')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1A1A22] transition-colors text-[#908f9e]"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[12px] text-[#818CF8] font-bold uppercase tracking-wider">Unit 3 • Lesson 5</span>
            <span className="text-[14px] font-semibold">Writing Assessment</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[800px] mx-auto p-6 md:p-10 flex flex-col gap-8">
        
        {/* Scenario Prompt */}
        <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-6 shadow-sm">
          <h2 className="text-[18px] font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-[#818CF8]" />
            The Scenario
          </h2>
          <p className="text-[15px] text-[#c6c5d5] leading-relaxed">
            A key client, Sarah Jenkins, just emailed expressing frustration that the project timeline has slipped by two weeks. You need to draft a professional follow-up email that acknowledges her frustration, clearly explains that the delay is due to the expanded scope they requested, and reassures her that the new timeline is solid. Maintain a diplomatic but firm tone.
          </p>
        </div>

        {/* Workspace */}
        <AnimatePresence mode="wait">
          {submissionState === "draft" && (
            <motion.div 
              key="draft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <div className="bg-[#131318] border border-[#242430] rounded-[14px] overflow-hidden focus-within:border-[#818CF8] transition-colors shadow-xl">
                {/* Email Client Header */}
                <div className="border-b border-[#242430] bg-[#1c1c23] p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-4 text-[14px]">
                    <span className="text-[#908f9e] w-12 font-medium">To:</span>
                    <span className="bg-[#242430] px-2 py-0.5 rounded-md text-[#c6c5d5]">Sarah Jenkins</span>
                  </div>
                  <div className="flex items-center gap-4 text-[14px]">
                    <span className="text-[#908f9e] w-12 font-medium">Subject:</span>
                    <input 
                      type="text" 
                      placeholder="Enter subject line..."
                      className="bg-transparent border-none outline-none text-[#e4e1e9] flex-1 placeholder:text-[#52525B]"
                      defaultValue="Project Timeline Update"
                    />
                  </div>
                </div>

                {/* Email Body */}
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Draft your email here..."
                  className="w-full h-[300px] bg-transparent border-none outline-none resize-none p-6 text-[15px] leading-relaxed text-[#e4e1e9] placeholder:text-[#52525B]"
                />

                {/* Footer Toolbar */}
                <div className="border-t border-[#242430] bg-[#1c1c23] p-4 flex justify-end">
                  <button 
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                    className="h-10 px-6 rounded-[10px] bg-[#818CF8] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <Send size={16} />
                    Submit for AI Grading
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {submissionState === "grading" && (
            <motion.div 
              key="grading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 rounded-full border-4 border-[#242430] border-t-[#818CF8] animate-spin mb-6" />
              <h2 className="text-[20px] font-bold text-white mb-2">Analyzing your draft...</h2>
              <p className="text-[#908f9e]">Evaluating tone, clarity, and structure.</p>
            </motion.div>
          )}

          {submissionState === "graded" && (
            <motion.div 
              key="graded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-400 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-[28px] font-bold text-white mb-2">Assessment Complete</h2>
                <p className="text-[#908f9e]">Review your AI-generated feedback below.</p>
              </div>

              {/* Rubric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-bold text-[#c6c5d5] uppercase tracking-wider">Tone</span>
                    <span className="text-[18px] font-bold text-yellow-400">8/10</span>
                  </div>
                  <p className="text-[13px] text-[#908f9e] leading-relaxed">
                    Polite and professional, but slightly defensive when explaining the scope change.
                  </p>
                </div>

                <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-bold text-[#c6c5d5] uppercase tracking-wider">Clarity</span>
                    <span className="text-[18px] font-bold text-green-400">9/10</span>
                  </div>
                  <p className="text-[13px] text-[#908f9e] leading-relaxed">
                    The reason for the delay is very clearly stated. No ambiguity.
                  </p>
                </div>

                <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-bold text-[#c6c5d5] uppercase tracking-wider">Structure</span>
                    <span className="text-[18px] font-bold text-pink-400">6/10</span>
                  </div>
                  <p className="text-[13px] text-[#908f9e] leading-relaxed">
                    You buried the new timeline at the end. State the new delivery date immediately after apologizing.
                  </p>
                </div>
              </div>

              {/* AI Rewrite Suggestion */}
              <div className="bg-gradient-to-br from-[#818CF8]/10 to-transparent border border-[#818CF8]/30 rounded-[14px] p-6 mt-4">
                <h3 className="text-[16px] font-bold text-[#818CF8] flex items-center gap-2 mb-4">
                  <Sparkles size={18} />
                  AI Suggested Rewrite
                </h3>
                <div className="bg-[#1c1c23] border border-[#242430] rounded-lg p-5 text-[15px] leading-relaxed text-[#c6c5d5]">
                  <p className="mb-4">Hi Sarah,</p>
                  <p className="mb-4">I understand your frustration regarding the shifted timeline. Because of the expanded scope we agreed upon last Tuesday, we are now targeting delivery for the 24th.</p>
                  <p className="mb-4">I assure you this new timeline is solid and allows us to accommodate the new features without compromising quality. I'm happy to jump on a call tomorrow to walk through the updated schedule.</p>
                  <p>Best regards,<br/>Umer</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => router.push('/home')}
                  className="h-12 px-8 rounded-[10px] bg-[#818CF8] text-[#0A0A0F] text-[15px] font-bold hover:bg-[#bdc2ff] transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
