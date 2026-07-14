"use client";
/**
 * @ai-restriction
 * Primary Owner: Mohsin
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2, CheckCircle, ChevronDown, Key, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [coachVoice, setCoachVoice] = useState("female");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        if (data?.settings?.coach_voice) setCoachVoice(data.settings.coach_voice);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/me/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coach_voice: coachVoice
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatusMessage("Settings saved successfully.");
    } catch (err) {
      setStatusMessage("Error saving settings.");
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
      "Delete your account? This will sign you out. Full server-side deletion still needs a dedicated backend delete route."
    );
    if (!confirmed) return;

    try {
      await supabase.auth.signOut();
      router.push("/sign-in");
    } catch (err) {
      setStatusMessage("Could not sign out cleanly.");
    }
  };

  return (
    <main className="flex-1 w-full flex justify-center py-10 px-6 md:px-0 overflow-y-auto">
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
            <div className="relative flex-shrink-0 group cursor-pointer">
              <div className="w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-[#818cf8] flex items-center justify-center bg-gradient-to-br from-[#818CF8] to-[#4f46e5]">
                <span className="text-white text-[32px] font-bold">{profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div className="absolute bottom-0 right-0 bg-[#818cf8] text-[#0A0A0F] rounded-full p-1.5 shadow-lg group-hover:scale-110 transition-transform">
                <Edit2 size={16} />
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 w-full space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Display Name</label>
                <input 
                  type="text" 
                  value={profile?.name || ""}
                  readOnly
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 text-[16px] text-[#e4e1e9] transition-colors opacity-80"
                />
              </div>
              
              <div>
                <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    defaultValue="alex.mercer@example.com"
                    readOnly
                    className="bg-[#1C1C23] border border-[#242430] w-full rounded-[10px] h-[48px] px-4 text-[16px] text-[#c6c5d5] cursor-not-allowed opacity-80"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-medium">
                    <CheckCircle size={14} className="mr-1" />
                    Verified
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Bio</label>
                <textarea 
                  rows={3}
                  defaultValue="Senior Developer focusing on improving technical communication for international teams."
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] p-4 text-[16px] text-[#e4e1e9] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-[#818cf8] text-[#0A0A0F] rounded-[10px] h-[40px] px-6 text-[14px] font-semibold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </section>

        {/* Learning Preferences */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-semibold text-[#e4e1e9]">Learning Preferences</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Coach Voice</label>
              <div className="relative">
                <select 
                  value={coachVoice}
                  onChange={(e) => setCoachVoice(e.target.value)}
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 appearance-none text-[16px] text-[#e4e1e9] cursor-pointer"
                >
                  <option value="female">Female (Default)</option>
                  <option value="male">Male</option>
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c6c5d5] pointer-events-none" />
              </div>
            </div>
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
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[#c6c5d5] hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password form" : "Show password form"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {showPassword && (
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="flex-1 bg-[#131318] border border-[#242430] rounded-[10px] h-[44px] px-4 text-[14px] text-[#e4e1e9] outline-none focus:border-[#818cf8]"
                  />
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordBusy}
                    className="bg-[#818cf8] text-[#0A0A0F] rounded-[10px] h-[44px] px-5 text-[14px] font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {passwordBusy ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-500/20">
            <h4 className="text-[14px] font-semibold text-red-500 mb-2">Danger Zone</h4>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-[14px] text-[#c6c5d5] max-w-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-[10px] text-[14px] font-semibold transition-colors whitespace-nowrap flex items-center"
              >
                <Trash2 size={18} className="mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {statusMessage && (
          <div className="text-sm text-[#c6c5d5] bg-[#131318] border border-[#242430] rounded-[10px] px-4 py-3">
            {statusMessage}
          </div>
        )}

      </div>
    </main>
  );
}
