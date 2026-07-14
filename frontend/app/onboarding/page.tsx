/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { getButtonClasses } from "@/components/ui/Button";
import Link from "next/link";
import { Bot } from "lucide-react";
import { MotionLink } from "@/components/ui/MotionLink";

export default function WelcomeOnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center mt-10">
      <div className="w-16 h-16 bg-[#1C1C23] border border-[#242430] rounded-2xl flex items-center justify-center mb-8">
        <Bot className="text-[#818CF8]" size={32} />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to Buslingo</h1>
      <p className="text-[16px] text-[#A0A0AB] max-w-[400px] leading-relaxed mb-10">
        Before we start, let's tailor your AI coach to your specific industry, English level, and professional goals.
      </p>

      <MotionLink 
        href="/onboarding/level" 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={getButtonClasses("primary", "default", "w-full max-w-[320px]")}
      >
        Get Started
      </MotionLink>
      
      <div className="mt-8 flex items-center gap-2 text-[13px] text-[#5F5F6B] font-medium">
        <span className="w-2 h-2 rounded-full bg-[#818CF8]"></span>
        Takes about 2 minutes
      </div>
    </div>
  );
}
