"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useEffect } from "react";
import { Star, Zap, Flame, TrendingUp, BookOpen, Mic, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

// The Confetti particle system translated to React
function ConfettiSystem() {
  useEffect(() => {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    // Clear any existing confetti (React StrictMode defense)
    container.innerHTML = '';
    
    const colors = ['#818CF8', '#22C55E', '#F59E0B'];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      
      // We inline the CSS animation for ease of portability, 
      // but it expects keyframes which we add to globals.css or inject here.
      particle.className = "absolute w-2 h-2 opacity-0 animate-confetti-burst";
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 150; 
      const tx = Math.cos(angle) * velocity + 'px';
      const ty = Math.sin(angle) * velocity + (Math.random() * 50) + 'px';
      const rot = (Math.random() * 720 - 360) + 'deg';
      const shape = Math.random() > 0.5 ? '50%' : '0%';

      particle.style.backgroundColor = color;
      particle.style.borderRadius = shape;
      particle.style.setProperty('--tx', tx);
      particle.style.setProperty('--ty', ty);
      particle.style.setProperty('--rot', rot);
      particle.style.animationDelay = (Math.random() * 0.2) + 's';

      container.appendChild(particle);
    }
    
    return () => {
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes burst {
            0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot)); opacity: 0; }
        }
        .animate-confetti-burst {
            animation: burst 1.5s ease-out forwards;
        }
      `}} />
      <div 
        id="confetti-container" 
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[1px] h-[1px] z-50 pointer-events-none"
      />
    </>
  );
}

export default function LessonCompletePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e4e1e9] flex flex-col items-center justify-center p-6 md:p-16 relative overflow-hidden font-sans">
      <ConfettiSystem />

      {/* Geometric background elements (Abstract) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <svg className="w-full h-full max-w-4xl opacity-10 text-[#242430]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
          <circle cx="50" cy="50" fill="none" r="30" stroke="currentColor" strokeWidth="0.5" />
          <path d="M 10 50 L 90 50 M 50 10 L 50 90" stroke="currentColor" strokeDasharray="1 4" strokeWidth="0.5" />
        </svg>
      </div>

      <main className="w-full max-w-2xl flex flex-col items-center text-center z-10 relative">
        
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Star className="text-[#818cf8] w-16 h-16 mb-4 mx-auto" fill="currentColor" />
          <h1 className="text-[48px] leading-[56px] tracking-[-0.02em] font-bold text-[#e4e1e9] mb-2">
            ✨ Lesson Complete!
          </h1>
          <p className="text-[18px] text-[#c6c5d5]">
            Disagreeing Politely
          </p>
        </div>

        {/* Rewards */}
        <div className="flex gap-4 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          <div className="bg-[#131318] border border-[#242430] rounded-lg px-6 py-3 flex items-center gap-2">
            <Zap className="text-[#818cf8]" fill="currentColor" size={24} />
            <span className="text-[20px] font-semibold text-[#818cf8]">+45 XP</span>
          </div>
          <div className="bg-[#131318] border border-[#242430] rounded-lg px-6 py-3 flex items-center gap-2">
            <Flame className="text-[#f7bd3e]" fill="currentColor" size={24} />
            <span className="text-[20px] font-semibold text-[#f7bd3e]">13 day streak</span>
          </div>
        </div>

        {/* Skill Improvements */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
          
          <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#22C55E] opacity-0 group-hover:opacity-5 transition-opacity" />
            <TrendingUp className="text-[#22C55E] mb-2" size={32} />
            <h3 className="text-[14px] font-semibold text-[#c6c5d5] mb-1">Grammar</h3>
            <p className="text-[20px] font-semibold text-[#22C55E]">+5%</p>
          </div>
          
          <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#818cf8] opacity-0 group-hover:opacity-5 transition-opacity" />
            <BookOpen className="text-[#818cf8] mb-2" size={32} />
            <h3 className="text-[14px] font-semibold text-[#c6c5d5] mb-1">Vocabulary</h3>
            <p className="text-[20px] font-semibold text-[#818cf8]">+3 words</p>
          </div>
          
          <div className="bg-[#131318] border border-[#242430] rounded-[14px] p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#908f9e] opacity-0 group-hover:opacity-5 transition-opacity" />
            <Mic className="text-[#908f9e] mb-2" size={32} />
            <h3 className="text-[14px] font-semibold text-[#c6c5d5] mb-1">Fluency</h3>
            <p className="text-[20px] font-semibold text-[#908f9e]">Stable</p>
          </div>
          
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <button 
            onClick={() => router.push('/home')}
            className="w-full sm:w-auto bg-[#818cf8] text-[#0A0A0F] text-[14px] font-semibold h-[40px] px-8 rounded-lg hover:bg-[#bdc2ff] transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Next lesson</span>
            <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => router.push('/learn')}
            className="w-full sm:w-auto bg-transparent text-[#818cf8] text-[14px] font-semibold h-[40px] px-8 rounded-lg hover:bg-[#1b1b20] transition-colors flex items-center justify-center active:scale-95"
          >
            Back to learning path
          </button>
        </div>

      </main>
    </div>
  );
}
