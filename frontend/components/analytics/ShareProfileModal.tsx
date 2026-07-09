"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Download, Copy, Share2 } from "lucide-react";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareProfileModal({ isOpen, onClose }: ShareProfileModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[500px] bg-[#131318] border border-[#35343a] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#242430]">
            <h3 className="text-[16px] font-bold text-[#e4e1e9] flex items-center gap-2">
              <Share2 size={18} className="text-[#818cf8]" />
              Share Your Profile
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-[#908f9e] hover:text-white hover:bg-[#242430] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* The Snapshot to Export */}
          <div className="p-6 bg-[#0e0e13] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background branding */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <circle cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" fill="none" r="30" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 10 50 L 90 50 M 50 10 L 50 90" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>

            <div className="relative z-10 w-full bg-[#131318] border border-[#242430] rounded-xl p-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#818cf8] to-[#c084fc] mb-4 flex items-center justify-center text-white text-[24px] font-bold shadow-lg">
                JD
              </div>
              <h2 className="text-[20px] font-bold text-white mb-1">Jane Doe</h2>
              <p className="text-[14px] text-[#908f9e] mb-6">Advanced Business English Speaker</p>

              <div className="w-full grid grid-cols-3 gap-2 text-center border-t border-b border-[#242430] py-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-[18px] font-bold text-[#818cf8]">2.4k</span>
                  <span className="text-[11px] text-[#908f9e] uppercase tracking-wider">Skill Pts</span>
                </div>
                <div className="flex flex-col border-l border-r border-[#242430]">
                  <span className="text-[18px] font-bold text-white">92%</span>
                  <span className="text-[11px] text-[#908f9e] uppercase tracking-wider">Grammar</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[18px] font-bold text-white">12</span>
                  <span className="text-[11px] text-[#908f9e] uppercase tracking-wider">Certificates</span>
                </div>
              </div>

              <div className="text-[12px] text-[#52525b] font-medium tracking-widest uppercase">
                Verified by Buslingo AI Coach
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 flex flex-col gap-3 bg-[#131318]">
            <button className="w-full h-12 rounded-[10px] bg-[#0077B5] text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#006097] transition-colors active:scale-95">
              <Globe size={20} />
              Share to LinkedIn
            </button>
            <div className="flex gap-3">
              <button className="flex-1 h-10 rounded-[10px] bg-[#1c1c23] border border-[#35343a] text-[#c6c5d5] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#2a292f] transition-colors active:scale-95">
                <Download size={16} />
                Download Image
              </button>
              <button className="flex-1 h-10 rounded-[10px] bg-[#1c1c23] border border-[#35343a] text-[#c6c5d5] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#2a292f] transition-colors active:scale-95">
                <Copy size={16} />
                Copy Link
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
