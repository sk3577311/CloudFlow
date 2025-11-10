"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function ReloadingPage() {
  const router = useRouter();

  // 🔄 dynamic messages to rotate
  const messages = [
    "Syncing jobs...",
    "Fetching metrics...",
    "Preparing dashboard...",
  ];
  const [index, setIndex] = useState(0);

  // ⏳ rotate message every 700ms
  useEffect(() => {
    const timers = [
      setTimeout(() => setIndex(1), 700),
      setTimeout(() => setIndex(2), 1300),
      setTimeout(() => router.replace("/dashboard"), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <motion.h2
          key={messages[index]} // animates on message change
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-medium text-gray-700 dark:text-gray-200"
        >
          {messages[index]}
        </motion.h2>
      </motion.div>
    </div>
  );
}
