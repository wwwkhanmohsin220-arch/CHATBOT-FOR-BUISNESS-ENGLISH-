"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Star, TrendingUp, CalendarDays, ArrowRight, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { TargetedFixCard } from "@/components/lesson/TargetedFixCard";

function ReportCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams?.get("instanceId");
  
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!instanceId) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/lesson-instances/${instanceId}/summary`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Failed to fetch summary", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [instanceId]);

  const handleRetry = async () => {
    if (!instanceId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lesson-instances/${instanceId}/restart`, { method: "POST" });
      if (!res.ok) {
        const body = await res.text().catch(() => "no body");
        throw new Error(`Restart failed with status: ${res.status}. Body: ${body}`);
      }
      const data = await res.json().catch(() => null);
      const nextInstanceId = data?.instance_id || instanceId;
      router.push(`/lesson/${nextInstanceId}`);
    } catch (err) {
      console.error("Failed to retry lesson", err);
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Geometrics */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-[0.03] text-white">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.1" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <main className="w-full max-w-[700px] mx-auto px-6 py-12 md:py-16 flex flex-col items-center z-10 relative">
        
        {/* Header Ribbon */}
        <div className="w-full flex items-center justify-between mb-12">
          <button 
            onClick={() => router.push('/learn')}
            className="flex items-center gap-2 text-[#908f9e] hover:text-white transition-colors text-[14px] font-semibold"
          >
            <ArrowLeft size={16} />
            Back to Path
          </button>
          
          <div className="flex gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            {summary?.final_score !== undefined && summary?.final_score !== null && (
              <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg px-4 py-2 flex items-center gap-2">
                <TrendingUp className="text-[#22c55e]" size={16} />
                <span className="text-[14px] font-bold text-[#22c55e]">Final Score: {summary.final_score}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Title */}
        <div className="w-full text-left mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex items-center gap-3 mb-2">
            <Star className="text-[#818cf8]" fill="currentColor" size={24} />
            <h1 className="text-[28px] leading-[34px] tracking-tight font-bold text-[#e4e1e9]">
              Session Report Card
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="w-full flex justify-center py-20">
             <Loader2 className="animate-spin text-[#818cf8]" size={32} />
          </div>
        ) : !summary ? (
          <div className="w-full bg-[#1c1c23] border border-[#242430] rounded-[14px] p-6 text-center text-[#A0A0AB]">
            No summary generated for this lesson yet.
          </div>
        ) : (
          <>
            {/* Executive Summary */}
            <div className="w-full bg-[#1c1c23] border border-[#242430] rounded-[14px] p-6 mb-10 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <h3 className="text-[14px] font-bold text-[#c6c5d5] uppercase tracking-wider mb-1">AI Coach Summary</h3>
              <p className="text-[15px] text-[#e4e1e9] leading-relaxed">
                {summary.summary_markdown}
              </p>
              {summary.next_lesson_focus && (
                <p className="text-[14px] text-[#818cf8] mt-2 font-medium">
                  {summary.next_lesson_focus}
                </p>
              )}
            </div>

            {/* Targeted Fixes */}
            {summary.prioritized_fixes?.length > 0 && (
              <div className="w-full flex flex-col gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                <h2 className="text-[18px] font-bold text-[#e4e1e9] mb-2 flex items-center gap-2">
                  Prioritized Fixes
                  <span className="bg-[#2a292f] text-[#c6c5d5] text-[12px] px-2 py-0.5 rounded-full font-medium">{summary.prioritized_fixes.length}</span>
                </h2>
                
                {summary.prioritized_fixes.map((fix: any, idx: number) => (
                  <div key={idx} className="w-full bg-[#1c1c23] border border-[#242430] rounded-[14px] p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#818cf8]/10 text-[#818cf8] text-[12px] px-2 py-0.5 rounded-[6px] font-semibold uppercase tracking-wider">
                        {fix.concept_tag.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {fix.example_from_user && (
                      <div className="bg-[#242430] rounded-[8px] p-3 border-l-2 border-[#ff4e4e]/50">
                        <p className="text-[14px] text-[#A0A0AB] italic">"{fix.example_from_user}"</p>
                      </div>
                    )}
                    <p className="text-[15px] text-[#e4e1e9] leading-relaxed">
                      {fix.why}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="w-full flex items-center justify-between border-t border-[#242430] pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <button 
            onClick={handleRetry}
            disabled={deleting}
            className="text-[#c6c5d5] text-[14px] font-medium h-[48px] px-6 rounded-[10px] hover:bg-[#242430] hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Retry Lesson
          </button>
          
          <button 
            onClick={() => router.push('/learn')}
            className="bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[48px] px-8 rounded-[10px] hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Next Lesson</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </main>
    </div>
  );
}

export default function SessionReportCardPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><Loader2 className="animate-spin text-[#818cf8]" /></div>}>
      <ReportCardContent />
    </Suspense>
  );
}
