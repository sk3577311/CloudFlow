"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  PlayCircle,
  TrendingUp,
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
} from "recharts";
import SkeletonCard from "@/components/SkeletonCard";
import { toast } from "sonner";

interface Task {
  id: string;
  name: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | string;
  last_run?: string;
}

interface Stats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(false);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tasks`, {
        headers: { "x-api-key": "supersecret123" },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: Task[] = await res.json();
      setTasks(data);

      setStats({
        total: data.length,
        pending: data.filter((t) => t.status === "pending").length,
        running: data.filter((t) => t.status === "running").length,
        completed: data.filter((t) => t.status === "completed").length,
        failed: data.filter((t) => t.status === "failed").length,
      });

      const grouped = data.reduce(
        (acc: any, task: Task) => {
          const time = new Date(task.last_run || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (!acc[time]) acc[time] = { time, completed: 0, failed: 0 };
          if (task.status === "completed") acc[time].completed++;
          if (task.status === "failed") acc[time].failed++;
          return acc;
        },
        {}
      );
      setChartData(Object.values(grouped));
      toast.success("✅ Tasks refreshed");
    } catch {
      toast.error("❌ Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "from-purple-500 to-indigo-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      color: "from-yellow-400 to-amber-500",
    },
    {
      label: "Running",
      value: stats.running,
      icon: <PlayCircle className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "from-red-500 to-rose-600",
    },
  ];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      default: "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-200",
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[status] || colors.default}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-neutral-50 dark:bg-[#1c1c1f] min-h-screen transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">Tasks Dashboard</h1>
        <button
          onClick={fetchTasks}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-indigo-500" : "text-gray-700 dark:text-gray-200"}`} />
          <span className="text-gray-700 dark:text-gray-200">{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
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

      {/* Chart */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm dark:shadow-md mb-10 transition-colors">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" /> Task Trends
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
            <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-md overflow-hidden transition-colors">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 font-medium">ID</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Last Run</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <motion.tr
                key={t.id}
                whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB" }}
                className="border-t border-gray-100 dark:border-neutral-800 cursor-pointer"
              >
                <td className="px-6 py-3 text-indigo-600 font-medium">{String(t.id).slice(0, 8)}</td>
                <td className="px-6 py-3">{t.name}</td>
                <td className="px-6 py-3">{t.type}</td>
                <td className="px-6 py-3">{statusBadge(t.status)}</td>
                <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                  {t.last_run ? new Date(t.last_run).toLocaleString() : "--"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
