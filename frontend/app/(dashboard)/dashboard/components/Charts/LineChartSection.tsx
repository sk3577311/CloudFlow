"use client";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function LineChartSection({ jobs }: { jobs: any[] }) {
  const grouped = jobs.reduce((acc: any, job) => {
    const time = new Date(job.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (!acc[time]) acc[time] = { time, completed: 0, failed: 0 };
    if (job.status === "completed") acc[time].completed++;
    if (job.status === "failed") acc[time].failed++;
    return acc;
  }, {});
  const chartData = Object.values(grouped);

  return (
    <div className="tf-card rounded-[22px] p-6 lg:col-span-2">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-white mb-4">
        <TrendingUp className="w-5 h-5 text-[var(--tf-accent)]" /> Job Completion Trend
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
          <XAxis dataKey="time" stroke="#9EA3A8" />
          <YAxis stroke="#9EA3A8" />
          <Tooltip contentStyle={{ background: "var(--tf-card)", color: "#fff", borderRadius: 12, border: "1px solid var(--tf-border)" }} />
          <Line type="monotone" dataKey="completed" stroke="#A4EAC0" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="failed" stroke="#FFB3B3" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
