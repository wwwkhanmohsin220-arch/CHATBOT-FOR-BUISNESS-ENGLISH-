"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { getButtonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { MotionLink } from "@/components/ui/MotionLink";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }
      
      router.push("/home");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
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
          <h1 className="text-[22px] font-semibold text-white mt-4">Update Password</h1>
          <p className="text-[#A0A0AB] text-[15px] mt-2">
            Enter a new password for your account.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[13px] p-3 rounded-[8px] mb-6 text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[13px] text-[#A0A0AB]">New Password</label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="cursor-pointer hover:text-white transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
              }
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !password}
            className={getButtonClasses("primary", "default", "w-full mt-2 flex justify-center items-center")}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin text-[#0A0A0F]" /> : "Update Password"}
          </motion.button>
        </form>

      </Card>
    </div>
  );
}
