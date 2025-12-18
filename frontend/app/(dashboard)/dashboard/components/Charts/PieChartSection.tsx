"use client";
import { Activity } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function PieChartSection({ jobs }: { jobs: any[] }) {
  const completed = jobs.filter((j) => j.status === "completed").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const queued = jobs.filter((j) => j.status === "queued").length;
  const processing = jobs.filter((j) => j.status === "processing").length;

  const pieData = [
    { name: "Completed", value: completed, color: "#A4EAC0" },
    { name: "Failed", value: failed, color: "#FFB3B3" },
    { name: "Queued", value: queued, color: "#EBD38B" },
    { name: "Processing", value: processing, color: "#C8EDF2" },
  ];

  return (
    <div className="tf-card rounded-[22px] p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-white mb-4">
        <Activity className="w-5 h-5 text-[var(--tf-accent)]" /> Job Status Breakdown
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) =>
            `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`
          }

          >
            {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--tf-card)", color: "#fff", border: "1px solid var(--tf-border)", borderRadius: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
