"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { getButtonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { MotionLink } from "@/components/ui/MotionLink";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        throw resetError;
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>

      <Card className="w-full max-w-[440px] p-8 sm:p-10 border-[#242430] bg-[#131318]/80 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-semibold text-white mt-4">Reset Password</h1>
          <p className="text-[#A0A0AB] text-[15px] mt-2">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[13px] p-3 rounded-[8px] mb-6 text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle2 className="text-[#818CF8] mb-4" size={48} />
            <p className="text-white font-medium mb-2">Check your email</p>
            <p className="text-[#A0A0AB] text-[13px] text-center mb-8">
              We sent a password reset link to <br/> <span className="text-white font-medium">{email}</span>
            </p>
            <MotionLink 
              href="/sign-in" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={getButtonClasses("secondary", "default", "w-full")}
            >
              Back to Sign In
            </MotionLink>
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || !email}
              className={getButtonClasses("primary", "default", "w-full mt-2 flex justify-center items-center")}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin text-[#0A0A0F]" /> : "Send Reset Link"}
            </motion.button>
          </form>
        )}

        {!success && (
          <div className="mt-6 pt-6 border-t border-[#242430]">
            <MotionLink 
              href="/sign-in" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={getButtonClasses("secondary", "default", "w-full")}
            >
              Back to Sign In
            </MotionLink>
          </div>
        )}
      </Card>
    </div>
  );
}
