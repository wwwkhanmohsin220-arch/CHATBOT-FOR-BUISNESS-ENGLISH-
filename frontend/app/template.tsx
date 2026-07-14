"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.1 // Just in case we use motion children inside
      }}
      className="flex-1 flex flex-col min-h-screen"
    >
      {children}
    </motion.div>
  );
}
