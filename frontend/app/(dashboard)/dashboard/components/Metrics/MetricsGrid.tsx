"use client";
import SkeletonCard from "@/components/SkeletonCard";
import MetricCard from "./MetricCard";

export default function MetricsGrid({
  jobs,
  cpuData,
  memoryData,
  loading,
  cpuTrend,
  memoryTrend,
}: {
  jobs: any[];
  cpuData: { time: string; value: number }[];
  memoryData: { time: string; value: number }[];
  loading: boolean;
  cpuTrend: "up" | "down" | "steady";
  memoryTrend: "up" | "down" | "steady";
}) {
  const total = jobs.length;
  const queued = jobs.filter((j) => j.status === "queued").length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const failed = jobs.filter((j) => j.status === "failed").length;

  const avgProc =
    jobs
      .filter((j) => j.status === "completed" && j.created_at && j.updated_at)
      .map((j) => new Date(j.updated_at).getTime() - new Date(j.created_at).getTime())
      .reduce((a, b) => a + b, 0) /
    Math.max(1, completed) /
    1000;

  const cpuPercent = cpuData.at(-1)?.value ?? 0;
  const memoryPercent = memoryData.at(-1)?.value ?? 0;

  const metricCards = [
    { label: "Total Jobs", value: total, color: "#a3d8dfff", sparkData: [] },
    { label: "Queued", value: queued, color: "#F2DCA3", sparkData: [] },
    { label: "Completed", value: completed, color: "#A9F2C8", sparkData: [] },
    { label: "Failed", value: failed, color: "#F5A3A3", sparkData: [] },
    { label: "Avg Proc (s)", value: avgProc.toFixed(1), color: "#CAB8FF", sparkData: [] },

    // CPU + Memory use sparkline + soft blue/teal
    { label: "CPU %", value: cpuPercent.toFixed(1), color: "#C8EDF2", sparkData: cpuData },
    { label: "Memory %", value: memoryPercent.toFixed(1), color: "#A3E9F5", sparkData: memoryData },
  ];

  return (
    <div className="mb-12">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-5">
          {[...Array(7)].map((_, i) => (<SkeletonCard key={i} />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-5">
          {metricCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              highlight={(card as any).highlight || false}
              sparkData={(card as any).sparkData || []}
              trend={(card as any).trend || "steady"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
