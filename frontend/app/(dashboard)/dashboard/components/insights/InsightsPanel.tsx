"use client";

import { motion } from "framer-motion";
import SmartForecastChart from "./SmartForecastChart";
import AnomaliesList from "./AnomaliesList";
import AuditTimeline from "./AuditTimeline";
import AutoHealButton from "./AutoHealButton";
import useMetricsSocket from "@/app/hooks/useMetricsSocket";
import { useState, useEffect } from "react";

export default function InsightsPanel() {
  const { metrics, forecasts, anomalies, auditLogs } = useMetricsSocket();

  const [cpuHistory, setCpuHistory] = useState<{ ts: number; value: number }[]>([]);
  const [memHistory, setMemHistory] = useState<{ ts: number; value: number }[]>([]);

  useEffect(() => {
    if (metrics) {
      const ts = metrics.ts || Date.now();
      setCpuHistory((prev) => [...prev.slice(-49), { ts, value: metrics.cpu ?? 0 }]);
      setMemHistory((prev) => [...prev.slice(-49), { ts, value: metrics.memory ?? 0 }]);
    }
  }, [metrics]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="tf-card rounded-[22px] p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          🧠 System Intelligence & Auto-Heal
        </h2>
        <AutoHealButton />
      </div>

      {/* Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SmartForecastChart
          title="CPU Forecast"
          liveData={cpuHistory}
          forecastData={forecasts?.cpu || []}
          color="#C8EDF2"
        />
        <SmartForecastChart
          title="Memory Forecast"
          liveData={memHistory}
          forecastData={forecasts?.memory || []}
          color="#A4EAC0"
        />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <AnomaliesList anomalies={anomalies} />
        <AuditTimeline logs={auditLogs} />
      </div>
    </motion.div>
  );
}
