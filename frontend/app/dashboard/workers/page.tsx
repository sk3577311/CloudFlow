"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  Power,
  RefreshCw,
  Cpu,
  TrendingUp,
  Signal,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import SkeletonCard from "@/components/SkeletonCard";
import { toast } from "sonner";

interface Worker {
  id: number;
  name: string;
  status: string;
  current_job?: string;
  uptime?: number;
  last_heartbeat?: string;
}

interface Stats {
  total: number;
  active: number;
  idle: number;
  offline: number;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    idle: 0,
    offline: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [scaling, setScaling] = useState(false);
  const [selectedScale, setSelectedScale] = useState<number>(1);
  const [isDark, setIsDark] = useState(false);

  async function fetchWorkers() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/workers`, {
        headers: { "x-api-key": "supersecret123" },
      });
      if (!res.ok) throw new Error("Failed to fetch workers");

      const data: Worker[] = await res.json();

      const updated = data.map((w) => {
        const diff = w.last_heartbeat
          ? (Date.now() - new Date(w.last_heartbeat).getTime()) / 1000
          : Infinity;
        if (diff < 30) w.status = "active";
        else if (diff < 60) w.status = "idle";
        else w.status = "offline";
        return w;
      });

      setWorkers(updated);

      const active = updated.filter((w) => w.status === "active").length;
      const idle = updated.filter((w) => w.status === "idle").length;
      const offline = updated.filter((w) => w.status === "offline").length;

      setStats({ total: updated.length, active, idle, offline });

      const grouped = updated.reduce(
        (acc: any, w: Worker) => {
          const time = new Date(w.last_heartbeat || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (!acc[time]) acc[time] = { time, active: 0, offline: 0 };
          if (w.status === "active") acc[time].active++;
          if (w.status === "offline") acc[time].offline++;
          return acc;
        },
        {}
      );

      setChartData(Object.values(grouped));
    } catch {
      toast.error("❌ Failed to load workers");
    } finally {
      setLoading(false);
    }
  }

  async function restartWorker() {
    try {
      toast.loading("Restarting worker...");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/workers/restart`, {
        method: "POST",
        headers: { "x-api-key": "supersecret123" },
      });
      if (!res.ok) throw new Error("Restart failed");
      toast.success("✅ Worker restarted successfully");
      fetchWorkers();
    } catch {
      toast.error("❌ Failed to restart worker");
    } finally {
      toast.dismiss();
    }
  }

  async function scaleWorkers(count: number) {
    try {
      setScaling(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/workers/scale?count=${count}`,
        {
          method: "POST",
          headers: { "x-api-key": "supersecret123" },
        }
      );
      if (!res.ok) throw new Error("Scaling failed");
      toast.success(`✅ Scaled to ${count} worker${count > 1 ? "s" : ""}`);
      fetchWorkers();
    } catch {
      toast.error("❌ Failed to scale workers");
    } finally {
      setScaling(false);
    }
  }

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 10000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: "Total Workers", value: stats.total, icon: <Cpu className="w-5 h-5" />, color: "from-blue-500 to-indigo-600" },
    { label: "Active", value: stats.active, icon: <Activity className="w-5 h-5" />, color: "from-green-500 to-emerald-600" },
    { label: "Idle", value: stats.idle, icon: <Clock className="w-5 h-5" />, color: "from-yellow-400 to-amber-500" },
    { label: "Offline", value: stats.offline, icon: <Power className="w-5 h-5" />, color: "from-red-500 to-rose-600" },
  ];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      idle: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      offline: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      default: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-200",
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[status] || colors.default}`}>
        {status}
      </span>
    );
  };

  const pieData = [
    { name: "Active", value: stats.active, color: "#10B981" },
    { name: "Idle", value: stats.idle, color: "#FBBF24" },
    { name: "Offline", value: stats.offline, color: "#EF4444" },
  ];

  return (
    <div className="p-6 bg-neutral-50 dark:bg-[#1c1c1f] min-h-screen transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          ⚙️ Worker Dashboard
        </h1>

        <div className="flex gap-3 items-center">
          {/* Restart Worker */}
          <button
            onClick={restartWorker}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition shadow-sm"
          >
            <RotateCcw className="w-5 h-5" /> Restart Worker
          </button>

          {/* Scale Dropdown */}
          <div className="relative">
            <select
              value={selectedScale}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSelectedScale(val);
                scaleWorkers(val);
              }}
              disabled={scaling}
              className="appearance-none cursor-pointer px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition pr-8 text-gray-700 dark:text-gray-200"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Worker{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-300 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {cards.map((c) => (
            <motion.div
              key={c.label}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-sm dark:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">{c.label}</span>
                {c.icon}
              </div>
              <h2 className="text-4xl font-bold">{c.value}</h2>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm dark:shadow-md col-span-2 transition-colors">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Worker Activity
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2b3036" : "#e5e7eb"} />
              <XAxis dataKey="time" stroke={isDark ? "#9ca3af" : "#4b5563"} />
              <YAxis stroke={isDark ? "#9ca3af" : "#4b5563"} />
              <Tooltip
                wrapperStyle={{
                  background: isDark ? "#0b0b0b" : "#fff",
                  border: `1px solid ${isDark ? "#2b3036" : "#e5e7eb"}`,
                  color: isDark ? "#f3f4f6" : "#111827",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={3} />
              <Line type="monotone" dataKey="offline" stroke="#EF4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm dark:shadow-md transition-colors">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
            <Signal className="w-5 h-5 text-indigo-500" /> Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{
                  background: isDark ? "#0b0b0b" : "#fff",
                  border: `1px solid ${isDark ? "#2b3036" : "#e5e7eb"}`,
                  color: isDark ? "#f3f4f6" : "#111827",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-md overflow-hidden transition-colors">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 font-medium">ID</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Current Job</th>
              <th className="px-6 py-3 font-medium">Uptime</th>
              <th className="px-6 py-3 font-medium">Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <motion.tr
                key={w.id}
                whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB" }}
                className="border-t border-gray-100 dark:border-neutral-800 cursor-pointer"
              >
                <td className="px-6 py-3 text-indigo-600 font-medium">{String(w.id).slice(0, 8)}</td>
                <td className="px-6 py-3">{w.name}</td>
                <td className="px-6 py-3">{statusBadge(w.status)}</td>
                <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{w.current_job || "—"}</td>
                <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                  {w.uptime ? `${(w.uptime / 60).toFixed(1)} min` : "—"}
                </td>
                <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                  {w.last_heartbeat ? new Date(w.last_heartbeat).toLocaleTimeString() : "—"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
