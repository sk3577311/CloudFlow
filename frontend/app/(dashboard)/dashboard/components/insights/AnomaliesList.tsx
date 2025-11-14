"use client";
import { motion } from "framer-motion";

export default function AnomaliesList({ anomalies }: { anomalies: any[] }) {
  if (!anomalies || anomalies.length === 0)
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-48 text-sm text-[var(--tf-text-dim)]">
        No anomalies detected recently ✅
      </motion.div>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="tf-card rounded-[22px] p-5">
      <h3 className="font-semibold text-white mb-3">⚠️ Recent Anomalies</h3>
      <div className="max-h-56 overflow-y-auto space-y-2">
        {anomalies.map((a, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-2 rounded-xl text-sm border border-[var(--tf-border)] ${a.severity === "high" ? "bg-[#3A2020] text-[#FFB3B3]" : "bg-[#2E2B17] text-[#EBD38B]"}`}>
            <span className="capitalize">{a.target}</span>
            <span>{a.value.toFixed(1)}%</span>
            <span className="text-xs opacity-70">{new Date(a.ts).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
