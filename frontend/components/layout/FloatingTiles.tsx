"use client";

import { motion } from "framer-motion";

export default function FloatingTile({ children, className }: any) {
  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.01,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`tf-card relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-x-0 -top-12 h-24 bg-[var(--tf-accent)]/10 blur-[70px]" />
      {children}
    </motion.div>
  );
}
