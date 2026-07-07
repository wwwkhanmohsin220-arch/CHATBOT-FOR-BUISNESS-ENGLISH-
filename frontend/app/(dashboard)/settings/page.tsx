"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { Edit2, CheckCircle, ChevronDown, Key, Link as LinkIcon, Download, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import Image from "next/image";

export default function SettingsPage() {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);

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
              <div className="w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-[#818cf8]">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
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
                  defaultValue="Alex Mercer"
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 text-[16px] text-[#e4e1e9] transition-colors"
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
            <button className="bg-[#818cf8] text-[#0A0A0F] rounded-[10px] h-[40px] px-6 text-[14px] font-semibold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
              Save changes
            </button>
          </div>
        </section>

        {/* Learning Preferences */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[20px] font-semibold text-[#e4e1e9]">Learning Preferences</h3>
            <span className="bg-[#2a292f] border border-[#454653] text-[#818cf8] px-3 py-1 rounded-full text-[12px] font-medium">
              Intermediate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Daily XP Goal</label>
              <div className="relative">
                <select 
                  defaultValue="100"
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 appearance-none text-[16px] text-[#e4e1e9] cursor-pointer"
                >
                  <option value="50">50 XP (Casual)</option>
                  <option value="100">100 XP (Regular)</option>
                  <option value="200">200 XP (Intense)</option>
                  <option value="300">300 XP (Immersive)</option>
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c6c5d5] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#c6c5d5] mb-1.5">Coach Personality</label>
              <div className="relative">
                <select 
                  defaultValue="direct"
                  className="bg-[#1C1C23] border border-[#242430] focus:border-[#818cf8] outline-none w-full rounded-[10px] h-[48px] px-4 appearance-none text-[16px] text-[#e4e1e9] cursor-pointer"
                >
                  <option value="encouraging">Encouraging & Gentle</option>
                  <option value="direct">Direct & Professional</option>
                  <option value="balanced">Balanced</option>
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c6c5d5] pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px]">
          <h3 className="text-[20px] font-semibold text-[#e4e1e9] mb-6">Notifications</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#454653]/30">
              <div>
                <div className="text-[16px] font-medium text-[#e4e1e9]">Daily Reminder</div>
                <div className="text-[14px] text-[#c6c5d5] mt-1">Get a push notification to practice.</div>
              </div>
              <div className="flex items-center space-x-4">
                <input 
                  type="time" 
                  defaultValue="09:00"
                  className="bg-[#1C1C23] border border-[#242430] rounded-[6px] px-2 py-1 text-[14px] font-medium text-[#e4e1e9] outline-none focus:border-[#818cf8]"
                />
                <Switch checked={dailyReminder} onChange={setDailyReminder} />
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-[#454653]/30">
              <div>
                <div className="text-[16px] font-medium text-[#e4e1e9]">Weekly Progress Report</div>
                <div className="text-[14px] text-[#c6c5d5] mt-1">Summary of your learning stats.</div>
              </div>
              <Switch checked={weeklyReport} onChange={setWeeklyReport} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[16px] font-medium text-[#e4e1e9]">Email Marketing</div>
                <div className="text-[14px] text-[#c6c5d5] mt-1">Updates on new features and courses.</div>
              </div>
              <Switch checked={emailMarketing} onChange={setEmailMarketing} />
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section className="bg-[#131318] border border-[#242430] rounded-[14px] p-[20px] md:p-[28px]">
          <h3 className="text-[20px] font-semibold text-[#e4e1e9] mb-6">Account Settings</h3>
          
          <div className="space-y-4 mb-8">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-[#1C1C23] border border-[#454653] hover:border-[#818cf8]/50 rounded-[10px] transition-colors group">
              <div className="flex items-center">
                <Key size={20} className="mr-3 text-[#c6c5d5] group-hover:text-[#818cf8] transition-colors" />
                <span className="text-[16px] text-[#e4e1e9]">Change Password</span>
              </div>
              <ChevronDown size={20} className="text-[#c6c5d5] -rotate-90" />
            </button>

            <div className="w-full flex items-center justify-between px-4 py-3 bg-[#1C1C23] border border-[#454653] rounded-[10px]">
              <div className="flex items-center">
                <LinkIcon size={20} className="mr-3 text-[#c6c5d5]" />
                <span className="text-[16px] text-[#e4e1e9]">Google Account</span>
              </div>
              <span className="text-xs font-medium bg-[#2a292f] px-2 py-1 rounded text-[#c6c5d5]">
                Connected
              </span>
            </div>

            <button className="w-full flex items-center justify-center px-4 py-3 border border-[#454653] rounded-[10px] hover:bg-[#2a292f] transition-colors text-[14px] font-semibold text-[#e4e1e9]">
              <Download size={18} className="mr-2" />
              Export My Data
            </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-500/20">
            <h4 className="text-[14px] font-semibold text-red-500 mb-2">Danger Zone</h4>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-[14px] text-[#c6c5d5] max-w-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-[10px] text-[14px] font-semibold transition-colors whitespace-nowrap flex items-center">
                <Trash2 size={18} className="mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
