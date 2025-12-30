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
const LineChartSection = dynamic(
  () => import("./components/Charts/LineChartSection"),
  { ssr: false }
);

const PieChartSection = dynamic(
  () => import("./components/Charts/PieChartSection"),
  { ssr: false }
);

const SystemMetricsSection = dynamic(
  () => import("./components/Charts/SystemMetricsSection"),
  { ssr: false }
);

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

  const [cpuData, setCpuData] = useState<any[]>([]);
  const [memoryData, setMemoryData] = useState<any[]>([]);

  const onWsMessage = useCallback((payload: any) => {
    if (!payload || payload.type !== "metrics") return;
    const ts = new Date().toLocaleTimeString();

    setCpuData((prev) => [
      ...prev.slice(-19),
      { time: ts, value: payload.data?.cpu ?? 0 },
    ]);

    setMemoryData((prev) => [
      ...prev.slice(-19),
      { time: ts, value: payload.data?.memory ?? 0 },
    ]);
  }, []);

  useMetricsSocket(onWsMessage);

  async function fetchJobs(triggeredByRefresh = false) {
    try {
      if (!triggeredByRefresh) setLoading(true);
      startLoading();

      const res = await fetch(`${API}/jobs/`, {
        headers: { "x-api-key": "supersecret123" },
      });

      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data: Job[] = await res.json();
      setJobs(data);
    } catch (err) {
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

  return (
    /**
     * IMPORTANT:
     * - FULL width canvas
     * - NO max-width here
     * - NO centering
     */
    <div className="w-full px-6">
      {/* 
      Inner canvas controls density,
      NOT the page itself
    */}
      <div className="mx-auto max-w-[1440px]">
        <MetricsGrid
          jobs={jobs}
          cpuData={cpuData}
          memoryData={memoryData}
          loading={loading}
        />

        <FiltersBar filter={filter} setFilter={setFilter} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          <LineChartSection jobs={jobs} />
          <PieChartSection jobs={jobs} />
        </div>

        <SystemMetricsSection cpuData={cpuData} memoryData={memoryData} />

        <InsightsPanel />

        <h2 className="text-xl font-semibold text-white mb-6 mt-6">
          💻 Jobs Tables
        </h2>

        <JobsTable jobs={jobs} filter={filter} onSelectJob={setSelectedJob} />

        {selectedJob && (
          <JobModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            retrying={retrying}
          />
        )}
      </div>
    </div>
  );
}
