"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Download, Globe } from "lucide-react";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitTitle: string;
}

export function CertificateModal({ isOpen, onClose, unitTitle }: CertificateModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[700px] bg-[#131318] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative"
        >
          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-[#1c1c23] border-b border-[#242430]">
            <span className="text-[14px] font-semibold text-[#c6c5d5]">Certificate of Completion</span>
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 rounded-md bg-[#2a292f] text-[#c6c5d5] hover:text-white hover:bg-[#35343a] transition-colors flex items-center gap-2 text-[13px] font-semibold">
                <Download size={14} />
                PDF
              </button>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[#908f9e] hover:text-white hover:bg-[#35343a] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-8 md:p-12 relative flex flex-col items-center justify-center text-center bg-[#0e0e13]">
            {/* Ornate borders */}
            <div className="absolute inset-4 border border-[#242430] pointer-events-none" />
            <div className="absolute inset-5 border border-[#818cf8]/20 pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-[#818cf8]/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(129,140,248,0.2)]">
              <Award size={32} className="text-[#818cf8]" />
            </div>

            <h1 className="text-[32px] md:text-[42px] font-serif tracking-tight text-[#e4e1e9] mb-4">
              Certificate of Excellence
            </h1>

            <p className="text-[16px] text-[#908f9e] mb-2 uppercase tracking-[0.2em]">
              This certifies that
            </p>
            
            <h2 className="text-[28px] font-bold text-white mb-8 border-b border-[#242430] pb-4 px-8 min-w-[300px]">
              Jane Doe
            </h2>

            <p className="text-[16px] text-[#908f9e] mb-2">
              has successfully completed all modules and demonstrated mastery in
            </p>
            
            <h3 className="text-[22px] font-bold text-[#818cf8] mb-12">
              {unitTitle}
            </h3>

            <div className="w-full flex justify-between items-end px-12 mt-8">
              <div className="flex flex-col items-center">
                <div className="w-40 border-b border-[#35343a] mb-2" />
                <span className="text-[12px] text-[#52525b] uppercase tracking-wider">Date</span>
                <span className="text-[14px] text-[#c6c5d5] font-semibold mt-1">July 2026</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#818cf8] rounded-full flex items-center justify-center text-[#0A0A0F] font-bold text-[10px] uppercase tracking-tighter mb-2 shadow-[0_0_15px_rgba(129,140,248,0.4)]">
                  Buslingo
                  <br />
                  Verified
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-40 border-b border-[#35343a] mb-2" />
                <span className="text-[12px] text-[#52525b] uppercase tracking-wider">AI Director</span>
                <span className="text-[14px] text-[#c6c5d5] font-semibold mt-1">Buslingo Coach</span>
              </div>
            </div>
          </div>
          
          {/* Share Footer */}
          <div className="p-4 bg-[#1c1c23] border-t border-[#242430] flex justify-center">
             <button className="h-10 px-6 rounded-[10px] bg-[#0077B5] text-white font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#006097] transition-colors active:scale-95">
              <Globe size={18} />
              Add to LinkedIn Profile
            </button>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
