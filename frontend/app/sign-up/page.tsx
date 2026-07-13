"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 * Talha: Do not modify UI/UX design, only permitted to hook up backend APIs.
 */
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { Button, getButtonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

function SignUpContent() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const level = searchParams.get("level") || "beginner";
  const goals = searchParams.get("goals") || "";

  const supabase = createClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }
      
      // Let's create the user profile on the backend using the Next.js API proxy
      const profileRes = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: username,
          level: level,
          goals: goals.split(",").filter(Boolean)
        })
      });

      if (!profileRes.ok) {
        console.error("Failed to create profile:", await profileRes.text());
      }

      router.push("/home"); // Go directly to home instead of sign-in, assuming auto-login!
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 dot-pattern relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.03)_0%,transparent_70%)] pointer-events-none" />

      <Card className="w-full max-w-[420px] p-10 relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-[22px] font-semibold text-white mt-8">Create Account</h1>
          <p className="text-[14px] text-[#A0A0AB] mt-3">
            Awesome! We&apos;ve generated your custom learning path. Create your free account to save it and start your first lesson.
          </p>
        </div>

        <Button variant="secondary" className="w-full mb-6 gap-3 font-medium">
          <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-[#242430]" />
          <span className="px-3 text-[13px] text-[#5F5F6B] bg-[#131318]">or</span>
          <div className="flex-grow h-px bg-[#242430]" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[13px] p-3 rounded-[8px] mb-6 text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[13px] text-[#A0A0AB]">Username</label>
            <Input
              type="text"
              placeholder="alexmercer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-[#A0A0AB]">Work Email</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-[#A0A0AB]">Password</label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              icon={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="cursor-pointer hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={getButtonClasses("primary", "default", "w-full mt-4 flex justify-center items-center")}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin text-[#0A0A0F]" /> : "Create Account"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#242430]">
          <Link href="/sign-in" className={getButtonClasses("secondary", "default", "w-full")}>
            Already have an account? Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}

import { Suspense } from "react";
export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
