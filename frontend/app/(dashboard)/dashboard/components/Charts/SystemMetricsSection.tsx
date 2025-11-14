"use client";
import dynamic from "next/dynamic";
import { Cpu, Monitor, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

interface Props { cpuData: { time: string; value: number }[]; memoryData: { time: string; value: number }[]; }

export default function SystemMetricsSection({ cpuData, memoryData }: Props) {
  const calcTrend = (data: { value: number }[]) => {
    if (data.length < 2) return "steady";
    const diff = data.at(-1)!.value - data.at(-2)!.value;
    if (diff > 1) return "up";
    if (diff < -1) return "down";
    return "steady";
  };

  const cpuTrend = calcTrend(cpuData);
  const memoryTrend = calcTrend(memoryData);

  const trendIcon = (trend: string) => {
    const colorMap: any = { up: "#A4EAC0", down: "#FFB3B3", steady: "#9EA3A8" };
    const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
    return <motion.div key={trend} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-1" style={{ color: colorMap[trend] }}>
      <Icon className="w-4 h-4" /><span className="text-xs font-medium">{trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}</span>
    </motion.div>;
  };

  const charts = [
    { title: "CPU Usage %", data: cpuData, color: "#C8EDF2", icon: <Cpu className="w-5 h-5 text-[var(--tf-accent)]" />, trend: cpuTrend },
    { title: "Memory Usage %", data: memoryData, color: "#A4EAC0", icon: <Monitor className="w-5 h-5 text-[var(--tf-accent)]" />, trend: memoryTrend },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
      {charts.map((m) => (
        <motion.div key={m.title} whileHover={{ scale: 1.01 }} className="tf-card rounded-[22px] p-6 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2 text-white">{m.icon} {m.title}</h2>
            {trendIcon(m.trend)}
          </div>

          <div className="h-52">
            {m.data && m.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.data.filter(d => typeof d.value === "number")} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="var(--tf-text-dim)" />
                  <YAxis stroke="var(--tf-text-dim)" />
                  <Tooltip contentStyle={{ background: "var(--tf-card)", color: "white", borderRadius: "12px", border: "1px solid var(--tf-border)" }} />
                  <Line type="monotone" dataKey="value" stroke={m.color} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--tf-text-dim)] text-sm">Waiting for metrics...</div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
