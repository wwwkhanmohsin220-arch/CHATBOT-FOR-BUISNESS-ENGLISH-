"use client";
/**
 * @ai-restriction
 * Primary Owner: Mohsin
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2, CheckCircle, ChevronDown, Key, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useCachedFetch, invalidateCache } from "@/hooks/useCachedFetch";
import { motion, AnimatePresence } from "framer-motion";
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { data: profileData, loading } = useCachedFetch("/api/me");

  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [coachVoice, setCoachVoice] = useState("female");
  const [timezone, setTimezone] = useState("UTC");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (profileData) {
      setProfile(profileData);
      if (profileData.settings?.coach_voice) setCoachVoice(profileData.settings.coach_voice);
      if (profileData.timezone) setTimezone(profileData.timezone);
      if (profileData.name) setDisplayName(profileData.name);
      if (profileData.email) setEmail(profileData.email);
    }
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.app_metadata?.provider === "google") {
        setIsGoogleUser(true);
      }
    };
    checkUser();
  }, [profileData]);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      if (email && email !== profileData?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }

      const res = await fetch("/api/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coach_voice: coachVoice,
          display_name: displayName,
          timezone: timezone
        })
      });
      if (!res.ok) throw new Error("Failed to save profile details");
      
      invalidateCache("/api/me");
      setStatusMessage("Settings saved successfully.");
    } catch (err: any) {
      setStatusMessage(err?.message || "Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setStatusMessage("Password must be at least 8 characters.");
      return;
    }

    setPasswordBusy(true);
    setStatusMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setStatusMessage("Password updated successfully.");
    } catch (err: any) {
      setStatusMessage(err?.message || "Could not update password.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure you want to delete your account? All your progress and data will be permanently erased."
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user data from server.");
      
      await supabase.auth.signOut();
      router.push("/sign-in");
    } catch (err: any) {
      setStatusMessage(err?.message || "Could not complete account deletion.");
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 w-full flex justify-center py-10 px-6 md:px-0 overflow-y-auto"
    >
      <div className="w-full max-w-[720px] space-y-8 pb-20">
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight text-[#e4e1e9]">
            Settings & Profile
          </h2>
          <p className="text-[16px] text-[#c6c5d5] mt-2">
            Manage your account details and learning preferences.
          </p>
        </div>

        {/* Profile Card */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px] relative">
          <h3 className="text-[20px] font-semibold text-[#e4e1e9] mb-6">Profile Details</h3>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0 cursor-default">
              <div className="w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-[#818cf8] flex items-center justify-center bg-gradient-to-br from-[#818CF8] to-[#4f46e5]">
                <span className="text-white text-[32px] font-bold">{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 w-full space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 text-[16px] text-[#e4e1e9] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  disabled={isGoogleUser}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 text-[16px] text-[#e4e1e9] transition-colors ${isGoogleUser ? 'bg-[#131318] opacity-60 cursor-not-allowed' : 'bg-[#1C1C23]'}`}
                  title={isGoogleUser ? "Email cannot be changed for Google accounts" : ""}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-[#818cf8] text-[#0A0A0F] rounded-[10px] h-[40px] px-6 text-[14px] font-semibold hover:opacity-90 transition-shadow shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </motion.button>
          </div>
        </section>

        {/* Learning Preferences */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-semibold text-[#e4e1e9]">Learning Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Coach Voice</label>
              <CustomSelect 
                value={coachVoice}
                onChange={setCoachVoice}
                options={[
                  { value: "female", label: "Female (Default)" },
                  { value: "male", label: "Male" }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Timezone</label>
              <CustomSelect 
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: "UTC", label: "UTC" },
                  { value: "America/New_York", label: "America/New_York (EST)" },
                  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
                  { value: "Europe/London", label: "Europe/London (GMT)" },
                  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
                  { value: "Asia/Karachi", label: "Asia/Karachi (PKT)" }
                ]}
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-[#818cf8] text-[#0A0A0F] rounded-[10px] h-[40px] px-6 text-[14px] font-semibold hover:opacity-90 transition-shadow shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save preferences"}
            </motion.button>
          </div>
        </section>

        {/* Account Settings */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px]">
          <h3 className="text-[20px] font-semibold text-[#e4e1e9] mb-6">Account Settings</h3>
          
          <div className="space-y-4 mb-8">
            <div className="bg-[#1C1C23] border border-[#454653] rounded-[10px] p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center">
                  <Key size={20} className="mr-3 text-[#c6c5d5]" />
                  <span className="text-[16px] text-[#e4e1e9]">Change Password</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[#c6c5d5] hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password form" : "Show password form"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.button>
              </div>

              <AnimatePresence>
                {showPassword && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row gap-3 pt-4">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="flex-1 bg-[#131318] border border-[#242430] rounded-[10px] h-[44px] px-4 text-[14px] text-[#e4e1e9] outline-none focus:border-[#818cf8]"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleChangePassword}
                        disabled={passwordBusy}
                        className="bg-[#818cf8] text-[#0A0A0F] rounded-[10px] h-[44px] px-5 text-[14px] font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {passwordBusy ? "Updating..." : "Update Password"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-500/20">
            <h4 className="text-[14px] font-semibold text-red-500 mb-2">Danger Zone</h4>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-[14px] text-[#c6c5d5] max-w-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleDeleteAccount}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-[10px] text-[14px] font-semibold transition-colors whitespace-nowrap flex items-center"
              >
                <Trash2 size={18} className="mr-2" />
                Delete Account
              </motion.button>
            </div>
          </div>
        </section>

        {statusMessage && (
          <div className="text-sm text-[#c6c5d5] bg-[#131318] border border-[#242430] rounded-[10px] px-4 py-3">
            {statusMessage}
          </div>
        )}

      </div>
    </motion.main>
  );
}
