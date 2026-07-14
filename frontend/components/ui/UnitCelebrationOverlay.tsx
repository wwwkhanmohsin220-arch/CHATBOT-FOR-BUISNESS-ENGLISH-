"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";

interface UnitCelebrationOverlayProps {
  unitTitle: string;
  onComplete: () => void;
}

export function UnitCelebrationOverlay({ unitTitle, onComplete }: UnitCelebrationOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fire confetti from bottom left and right corners
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ["#818CF8", "#F472B6", "#34D399", "#FBBF24"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ["#818CF8", "#F472B6", "#34D399", "#FBBF24"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    // Start confetti
    frame();
    
    // Big burst in the middle
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#818CF8", "#F472B6", "#34D399", "#FBBF24"],
        disableForReducedMotion: true
      });
    }, 500);

    // Auto-hide the overlay after 4 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4500);

    // Call onComplete after exit animation finishes
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
            className="bg-[#131318] border border-[#242430] p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center max-w-sm mx-4 pointer-events-auto relative overflow-hidden"
          >
            {/* Soft inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#818CF8]/10 to-transparent pointer-events-none" />

            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#818CF8] to-[#c4b5fd] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(129,140,248,0.4)] relative z-10"
            >
              <Trophy size={40} className="text-white" />
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-[28px] font-bold text-white text-center mb-2 tracking-tight relative z-10"
            >
              Unit Complete!
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[#A0A0AB] text-center text-[15px] font-medium relative z-10"
            >
              Congratulations on finishing
              <span className="block mt-1 text-[#c4b5fd] font-bold">{unitTitle}</span>
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
