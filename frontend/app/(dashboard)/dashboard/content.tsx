"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useRefresh } from "@/lib/refreshContext";
import { showToast } from "@/components/Toast";
import useMetricsSocket from "@/lib/useMetricsSocket";

// modular pieces
import MetricsGrid from "./components/Metrics/MetricsGrid";
import FiltersBar from "./components/FiltersBar";
import JobsTable from "./components/JobsTable";
import JobModal from "./components/JobModal";
import InsightsPanel from "./components/insights/InsightsPanel";

// lazy heavy charts
const LineChartSection = dynamic(() => import("./components/Charts/LineChartSection"), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-neutral-100 dark:bg-neutral-900 rounded-2xl animate-pulse" />,
});
const PieChartSection = dynamic(() => import("./components/Charts/PieChartSection"), {
  ssr: false,
  loading: () => <div className="h-[350px] bg-neutral-100 dark:bg-neutral-900 rounded-2xl animate-pulse" />,
});
const SystemMetricsSection = dynamic(() => import("./components/Charts/SystemMetricsSection"), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-neutral-100 dark:bg-neutral-900 rounded-2xl animate-pulse" />,
});

interface Job {
  id: string;
  task: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  history?: { status: string; time: string }[];
}

export default function DashboardContent() {
  const { subscribe, startLoading, stopLoading } = useRefresh();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [retrying, setRetrying] = useState(false);

  const [cpuData, setCpuData] = useState<{ time: string; value: number; trend?: "up" | "down" | "steady" }[]>([]);
  const [memoryData, setMemoryData] = useState<{ time: string; value: number; trend?: "up" | "down" | "steady" }[]>([]);

  // --- WebSocket metrics sink ---
  const onWsMessage = useCallback((payload: any) => {
    if (!payload || payload.type !== "metrics") return;
    const d = payload.data || {};
    const ts = new Date().toLocaleTimeString();

    // CPU
    setCpuData(prev => {
      const prevVal = prev.at(-1)?.value ?? 0;
      const val = typeof d.cpu === "number" ? d.cpu : prevVal;
      const trend = val > prevVal ? "up" : val < prevVal ? "down" : "steady";
      return [...prev.slice(-19), { time: ts, value: val, trend }];
    });

    // Memory
    setMemoryData(prev => {
      const prevVal = prev.at(-1)?.value ?? 0;
      const val = typeof d.memory === "number" ? d.memory : prevVal;
      const trend = val > prevVal ? "up" : val < prevVal ? "down" : "steady";
      return [...prev.slice(-19), { time: ts, value: val, trend }];
    });
  }, []);

  useMetricsSocket(onWsMessage);

  // --- Jobs fetch (HTTP) ---
  async function fetchJobs(triggeredByRefresh = false) {
    try {
      if (!triggeredByRefresh) setLoading(true);
      startLoading();

      const res = await fetch(`${API}/jobs/`, {
        headers: { "x-api-key": "supersecret123" },
      });
      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data: Job[] = await res.json();
      const enriched = data.map((job) => ({
        ...job,
        history: [
          { status: "queued", time: job.created_at || "" },
          ...(job.status !== "queued" ? [{ status: job.status, time: job.updated_at || "" }] : []),
        ],
      }));

      setJobs(enriched);
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to fetch jobs!", "error");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  useEffect(() => {
    const unsub = subscribe(() => fetchJobs(true));
    fetchJobs();
    return () => unsub();
  }, [subscribe]);

  const cpuTrend = cpuData.at(-1)?.trend ?? "steady";
  const memoryTrend = memoryData.at(-1)?.trend ?? "steady";

  return (
    <div className="transition-colors duration-300">
      <MetricsGrid
        jobs={jobs}
        cpuData={cpuData}
        memoryData={memoryData}
        loading={loading}
        cpuTrend={cpuTrend}
        memoryTrend={memoryTrend}
      />

      <FiltersBar filter={filter} setFilter={setFilter} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        <LineChartSection jobs={jobs} />
        <PieChartSection jobs={jobs} />
      </div>

      <SystemMetricsSection cpuData={cpuData} memoryData={memoryData} />
      <InsightsPanel />
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-6 mt-6">
        💻 Jobs Tables
      </h2>
      <JobsTable jobs={jobs} filter={filter} onSelectJob={setSelectedJob} />

      {selectedJob && (
        <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} retrying={retrying} />
      )}
    </div>
  );
}
