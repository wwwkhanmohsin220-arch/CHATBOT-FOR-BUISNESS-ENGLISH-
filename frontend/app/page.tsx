/**
 * @ai-restriction
 * Primary Owner: Umer
 * Talha & Mohsin: Do not modify UI/UX design, only permitted to hook up backend APIs or Voice APIs.
 */
import { Logo } from "@/components/ui/Logo";
import { getButtonClasses } from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, Mic, Presentation, Mail, Brain, LineChart } from "lucide-react";
import ColorBends from "@/components/ui/ColorBends";
import { MotionLink } from "@/components/ui/MotionLink";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="fixed top-0 w-full h-16 z-50 border-b border-white/10 bg-black/30 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] supports-[backdrop-filter]:bg-black/30">
        <div className="flex justify-between items-center px-4 md:px-16 max-w-7xl mx-auto h-full">
          <Logo />
          <div className="flex items-center gap-3 md:gap-6">
            <MotionLink 
              href="/sign-in" 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              className="text-[#c6c5d5] font-medium hover:text-[#bdc2ff] transition-colors duration-200 text-[13px] md:text-[15px]"
            >
              Sign in
            </MotionLink>
            <MotionLink 
              href="/onboarding" 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              className={getButtonClasses("primary", "default", "h-9 px-3 text-[13px] md:h-12 md:px-6 md:text-[15px]")}
            >
              Start Learning
            </MotionLink>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <section className="relative flex flex-col items-center justify-center pt-32 md:pt-48 pb-16 md:pb-24 px-5 md:px-16 text-center overflow-hidden min-h-[500px] md:min-h-[600px]">
          <div className="absolute inset-0 z-0 opacity-40" style={{ maskImage: "linear-gradient(to bottom, white 50%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, white 50%, transparent 100%)" }}>
            <ColorBends
              colors={["#838CF1", "#8a5cff", "#00ffd1"]}
              rotation={-20}
              speed={0.97}
              scale={3.2}
              frequency={1.8}
              warpStrength={1}
              mouseInfluence={1}
              noise={0.54}
              parallax={0.5}
              iterations={1}
              intensity={1.5}
              bandWidth={6}
              transparent={true}
              autoRotate={0}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-[680px] mb-4 md:mb-6 text-[#F2F2F2]">
              Master the Language of Business
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-[#A0A0AB] max-w-[560px] mb-8 md:mb-10">
              Interactive voice AI coaching for professionals. Perfect your spoken English through immersive, dynamic conversational scenarios.
            </p>
            <MotionLink 
              href="/onboarding" 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              className={getButtonClasses("primary", "lg", "mb-6")}
            >
              Start Learning
            </MotionLink>
            <p className="text-sm text-[#5F5F6B]">
              Already have an account? <Link href="/sign-in" className="text-[#818CF8] hover:underline">Sign in</Link>
            </p>

            <div className="mt-16 md:mt-24 flex flex-col items-center">
              <p className="text-sm text-[#5F5F6B] mb-6">Powered by modern enterprise-grade technology</p>
              <div className="flex flex-wrap justify-center gap-5 md:gap-10 text-sm text-[#5F5F6B] font-medium">
                <span>Next.js</span>
                <span>FastAPI</span>
                <span>Supabase</span>
                <span>Groq</span>
                <span>Fish Audio</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-5 md:px-16 max-w-7xl mx-auto">
          <h2 className="text-3xl font-semibold text-[#F2F2F2] mb-12 text-center">Cutting-edge AI tools to elevate your spoken English</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BookOpen className="text-[#818CF8]" size={20} />}
              title="Conversational RAG"
              description="Our retrieval engine surfaces hyper-relevant corporate vocabulary for every scenario."
            />
            <FeatureCard
              icon={<Mic className="text-[#818CF8]" size={20} />}
              title="Voice AI Coach"
              description="Engage in ultra-low latency voice conversations powered by advanced LLM models."
            />
            <FeatureCard
              icon={<Presentation className="text-[#818CF8]" size={20} />}
              title="Dynamic Scenarios"
              description="Practice high-stakes negotiations with adaptive AI that responds in real-time."
            />
            <FeatureCard
              icon={<Mail className="text-[#818CF8]" size={20} />}
              title="Threaded Theory"
              description="Learn through interactive, threaded dialogues tailored to your exact skill level."
            />
            <FeatureCard
              icon={<Brain className="text-[#818CF8]" size={20} />}
              title="Adaptive Learning"
              description="Experience personalized curriculum generation that adapts to your performance."
            />
            <FeatureCard
              icon={<LineChart className="text-[#818CF8]" size={20} />}
              title="Progress Tracking"
              description="Monitor your spoken fluency and track your mastery metrics on a visual heatmap."
            />
          </div>
        </section>
      </main>

      <footer className="bg-[#131318] py-8 border-t border-subtle w-full mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-16 max-w-7xl mx-auto gap-4">
          <div className="text-sm text-[#5F5F6B] flex flex-col md:flex-row items-center gap-2">
            <span>© 2026 Buslingo.</span>
            <span className="hidden md:inline">•</span>
            <span>Open-source portfolio project</span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-[#5F5F6B]">
            <span>Built by Mohsin, Umer & Talha</span>
            <span className="hidden md:inline">•</span>
            <a href="https://github.com/wwwkhanmohsin220-arch/CHATBOT-FOR-BUISNESS-ENGLISH-" target="_blank" rel="noreferrer" className="hover:text-[#F2F2F2] transition-colors underline underline-offset-4">View Source</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-layer-1 border border-subtle rounded-[14px] p-7 hover:border-[#3F3F4E] transition-colors">
      <div className="w-11 h-11 bg-layer-2 rounded-xl flex items-center justify-center mb-5 border border-subtle">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#F2F2F2] mb-2">{title}</h3>
      <p className="text-[15px] text-[#A0A0AB] leading-relaxed">{description}</p>
    </div>
  );
}
