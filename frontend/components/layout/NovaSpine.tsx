"use client";

import { motion } from "framer-motion";
import { Cpu, Database } from "lucide-react";

export default function NovaSpine({
  cpu = 0,
  memory = 0,
  workers = 0,
}: {
  cpu?: number;
  memory?: number;
  workers?: number;
}) {
  return (
    <aside className="fixed right-6 top-28 bottom-10 z-40 pointer-events-auto">
      <div className="flex flex-col gap-3">
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }} className="tf-card p-3 rounded-xl w-20 flex flex-col items-center">
          <Cpu className="w-5 h-5 text-white/80" />
          <div className="text-xs mt-2 font-semibold text-white/90">{cpu}%</div>
          <div className="text-[10px] text-[var(--tf-text-dim)]">CPU</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.32 }} className="tf-card p-3 rounded-xl w-20 flex flex-col items-center">
          <Database className="w-5 h-5 text-white/80" />
          <div className="text-xs mt-2 font-semibold text-white/90">{memory}%</div>
          <div className="text-[10px] text-[var(--tf-text-dim)]">Memory</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.36 }} className="tf-card p-3 rounded-xl w-20 flex flex-col items-center">
          <div className="text-xs font-semibold text-white/90">{workers}</div>
          <div className="text-[10px] text-[var(--tf-text-dim)]">Workers</div>
        </motion.div>
      </div>
    </aside>
  );
}
