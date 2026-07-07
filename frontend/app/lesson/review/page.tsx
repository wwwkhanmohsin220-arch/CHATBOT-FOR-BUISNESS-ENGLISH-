"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { X, Touchpad, Edit, RefreshCw, AlertTriangle, Lightbulb, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ReviewSessionPage() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [fillBlank, setFillBlank] = useState("");
  const [toneRefinement, setToneRefinement] = useState("");

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#e4e1e9] bg-[#0A0A0F] antialiased selection:bg-[#818cf8] selection:text-[#0A0A0F]">
      
      {/* Top Navigation */}
      <header className="flex justify-between items-center px-6 md:px-16 py-4 w-full sticky top-0 z-50 bg-[#0A0A0F] border-b border-[#242430]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            aria-label="Close Review" 
            className="text-[#c6c5d5] hover:text-[#bdc2ff] transition-colors cursor-pointer active:opacity-80 flex items-center justify-center p-2 rounded-full hover:bg-[#1b1b20]"
          >
            <X size={24} />
          </button>
          <h1 className="text-[20px] font-semibold text-[#e4e1e9]">Review Session</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-[#c6c5d5]">Item 3 of 8</span>
            <div className="w-32 h-1 bg-[#242430] rounded-full overflow-hidden flex">
              <div className="bg-[#818cf8] h-full rounded-full" style={{ width: '37.5%' }} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-6 md:px-0 w-full overflow-y-auto">
        <div className="w-full max-w-[680px] flex flex-col gap-6">
          
          <div className="flex justify-between items-center px-2">
            <h2 className="text-[24px] md:text-[32px] font-bold text-[#e4e1e9]">Vocabulary Mastery</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* 1. FLASHCARD */}
            <div 
              className="group relative w-full h-[280px] cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: "1000px" }}
            >
              <div 
                className={cn(
                  "w-full h-full relative shadow-sm rounded-xl transition-all duration-500",
                  "transform-style-3d"
                )}
                style={{ 
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
              >
                {/* Front */}
                <div 
                  className="absolute inset-0 bg-[#131318] border border-[#242430] rounded-xl p-5 flex flex-col items-center justify-center group-hover:border-[#3F3F4E] transition-colors"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-[28px] font-bold text-[#e4e1e9] tracking-tight mb-2">leverage</span>
                  <span className="text-[14px] font-semibold text-[#908f9e] italic bg-[#1f1f25] px-3 py-1 rounded-md mb-8">verb</span>
                  
                  <div className="absolute bottom-6 flex items-center gap-2 text-[#c6c5d5] opacity-70 group-hover:opacity-100 transition-opacity">
                    <Touchpad size={18} />
                    <span className="text-[12px] font-medium">Tap to flip</span>
                  </div>
                  
                  {/* Subtle geometric decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#242430] to-transparent opacity-20 rounded-tr-xl pointer-events-none" />
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 bg-[#131318] border border-[#818cf8] rounded-xl p-5 flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="text-center max-w-[80%]">
                    <p className="text-[18px] text-[#e4e1e9] mb-6">to use something that you already have in order to achieve something new or better.</p>
                    <div className="bg-[#1f1f25] p-4 rounded-lg border border-[#242430] text-left">
                      <p className="text-[14px] text-[#c6c5d5]">
                        <span className="text-[#818cf8] font-semibold mr-1">Example:</span> 
                        "We need to <span className="text-[#e4e1e9] font-semibold underline decoration-[#818cf8]">leverage</span> our existing network to find new clients."
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 flex items-center gap-2 text-[#c6c5d5]">
                    <Touchpad size={18} />
                    <span className="text-[12px] font-medium">Tap to return</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. FILL IN THE BLANK */}
            <div className="bg-[#131318] border border-[#242430] rounded-xl p-[28px] flex flex-col gap-6 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-[#818cf8]">
                  <Edit size={20} />
                  <h3 className="text-[14px] font-semibold uppercase tracking-wider">Contextual Usage</h3>
                </div>
                <span className="text-[12px] font-medium text-[#908f9e] border border-[#242430] rounded px-2 py-1">
                  From: Unit 2, Lesson 3
                </span>
              </div>
              
              <div className="text-[20px] font-semibold text-[#e4e1e9] leading-relaxed flex flex-wrap items-center gap-2">
                <span>We need to</span>
                <input 
                  type="text" 
                  value={fillBlank}
                  onChange={(e) => setFillBlank(e.target.value)}
                  placeholder="type here"
                  className="bg-[#1C1C23] border border-[#242430] text-[#e4e1e9] text-[16px] font-normal rounded text-center focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] w-32 h-10 px-2 outline-none transition-colors placeholder:text-[#52525B]" 
                />
                <span>our strategy to capture the new market segment.</span>
              </div>
              
              <div className="flex justify-end mt-4 z-10 relative">
                <button className="bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold rounded-[10px] h-10 px-6 hover:bg-opacity-90 transition-opacity active:scale-95">
                  Check Answer
                </button>
              </div>

              {/* Decorative background grid line */}
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <svg height="120" viewBox="0 0 120 120" width="120" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 20 h120 M0 40 h120 M0 60 h120 M0 80 h120 M0 100 h120 M20 0 v120 M40 0 v120 M60 0 v120 M80 0 v120 M100 0 v120" fill="none" stroke="#818CF8" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* 3. REWRITE EXERCISE */}
            <div className="bg-[#131318] border border-[#242430] rounded-xl p-[28px] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#818cf8] mb-2">
                <RefreshCw size={20} />
                <h3 className="text-[14px] font-semibold uppercase tracking-wider">Tone Refinement</h3>
              </div>
              <p className="text-[16px] text-[#c6c5d5] mb-2">
                Rewrite this sentence to sound more professional in a corporate context.
              </p>
              
              <div className="bg-[#1C1C23] border border-[#ffb4ab]/30 rounded-lg p-4 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ffb4ab] rounded-l-lg" />
                <p className="text-[18px] text-[#e4e1e9] pl-2">"I think your idea is wrong."</p>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ffb4ab]">
                  <AlertTriangle size={20} />
                </div>
              </div>
              
              <div className="relative mt-2">
                <textarea 
                  value={toneRefinement}
                  onChange={(e) => setToneRefinement(e.target.value)}
                  placeholder="Type your refined version here..."
                  className="w-full bg-[#1C1C23] border border-[#242430] rounded-lg p-4 text-[16px] text-[#e4e1e9] min-h-[100px] resize-none focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] outline-none transition-colors placeholder:text-[#52525B]" 
                />
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <button className="text-[#c6c5d5] text-[12px] font-medium hover:text-[#818cf8] flex items-center gap-1 transition-colors">
                  <Lightbulb size={16} /> Hint
                </button>
                <button 
                  onClick={() => router.push('/lesson/complete')}
                  className="border border-[#818cf8] text-[#818cf8] bg-transparent text-[14px] font-semibold rounded-[10px] h-10 px-6 hover:bg-[#818cf8]/10 transition-colors active:scale-95"
                >
                  Evaluate
                </button>
              </div>
            </div>

          </div>

          {/* End of Session Action */}
          <div className="flex justify-center mt-8 mb-12">
            <button 
              onClick={() => router.push('/lesson/complete')}
              className="text-[#818cf8] text-[14px] font-semibold hover:text-white transition-colors flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-[#1b1b20]"
            >
              <Flag size={18} />
              End Session Early
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
