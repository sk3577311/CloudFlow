"use client";
import { motion } from "framer-motion";

export default function AuditTimeline({ logs = [] }: { logs: any[] }) {
  if (!logs || logs.length === 0)
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-48 text-sm text-[var(--tf-text-dim)]">
        No system activity yet 💤
      </motion.div>
    );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="tf-card rounded-[22px] p-5">
      <h3 className="font-semibold text-white mb-3">🕓 System Activity Log</h3>
      <div className="max-h-56 overflow-y-auto text-sm space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="flex justify-between items-center py-1">
            <span className="text-[var(--tf-accent)]">{log.event}</span>
            <span className="text-xs text-[var(--tf-text-dim)]">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
