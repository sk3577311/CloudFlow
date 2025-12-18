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
  status: string;
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

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tasks/`, {
        headers: { "x-api-key": "supersecret123" },
      });
      const data: Task[] = await res.json();
      setTasks(data);

      setStats({
        total: data.length,
        pending: data.filter((t) => t.status === "pending").length,
        running: data.filter((t) => t.status === "running").length,
        completed: data.filter((t) => t.status === "completed").length,
        failed: data.filter((t) => t.status === "failed").length,
      });

      const grouped = data.reduce((acc: any, t: Task) => {
        const time = new Date(t.last_run || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (!acc[time]) acc[time] = { time, completed: 0, failed: 0 };
        if (t.status === "completed") acc[time].completed++;
        if (t.status === "failed") acc[time].failed++;
        return acc;
      }, {});
      setChartData(Object.values(grouped));
      toast.success("✅ Tasks updated");
    } catch {
      toast.error("❌ Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-300",
      running: "bg-blue-500/20 text-blue-300",
      completed: "bg-green-500/20 text-green-300",
      failed: "bg-red-500/20 text-red-300",
    };
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[status] || "bg-neutral-700 text-gray-200"
          }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-[var(--tf-bg)] min-h-screen text-[var(--tf-text)] transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-100">📋 TaskFlow Cloud — Tasks</h1>
          <p className="text-sm text-[var(--tf-text-dim)] mt-1">
            Real-time task insights and workflow status
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="px-4 py-2 rounded-xl tf-card border border-[var(--tf-border)] flex items-center gap-2 hover:shadow-md"
        >
          <RefreshCw
            className={`w-5 h-5 ${loading ? "animate-spin text-[var(--tf-accent)]" : "text-[var(--tf-text-dim)]"
              }`}
          />
          <span className="text-sm text-[var(--tf-text-dim)]">
            {loading ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {[
            { label: "Total Tasks", value: stats.total, icon: <ClipboardList /> },
            { label: "Pending", value: stats.pending, icon: <Clock /> },
            { label: "Running", value: stats.running, icon: <PlayCircle /> },
            { label: "Completed", value: stats.completed, icon: <CheckCircle /> },
            { label: "Failed", value: stats.failed, icon: <AlertTriangle /> },
          ].map((c, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="tf-card p-6 rounded-2xl border border-[var(--tf-border)] shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--tf-text-dim)]">{c.label}</span>
                <div className="text-[var(--tf-accent)] opacity-80">{c.icon}</div>
              </div>
              <h2 className="text-4xl font-bold text-gray-100">{c.value}</h2>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* --- Task Health Index (NEW) --- */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.25 }}
        className="tf-card p-6 rounded-2xl mb-10 border border-[var(--tf-border)] shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--tf-text-dim)]">Task Health Index</div>
            <div className="text-3xl font-semibold text-gray-100 mt-1">
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </div>
            <div className="text-xs text-[var(--tf-text-dim)] mt-2">
              Based on completed / total tasks
            </div>
          </div>

          <div className="text-[var(--tf-text-dim)] text-center">
            <TrendingUp className="w-12 h-12 text-[var(--tf-accent)]" />
            <div className="mt-2 text-sm">
              Completed {stats.completed}/{stats.total}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-[var(--tf-card)] rounded-full h-3 overflow-hidden border border-[var(--tf-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${stats.total > 0
                    ? (stats.completed / stats.total) * 100
                    : 0
                  }%`,
              }}
              transition={{ duration: 0.8 }}
              className="h-3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--tf-accent), #9fe9ee)",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Chart Section */}
      <motion.div whileHover={{ scale: 1.01 }} className="tf-card p-6 rounded-2xl mb-10">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-100">
          <TrendingUp className="w-5 h-5 text-[var(--tf-accent)]" /> Task Trends
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                background: "var(--tf-card)",
                border: "1px solid var(--tf-border)",
                color: "#fff",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke="#14B8A6" strokeWidth={3} />
            <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Table */}
      <motion.div whileHover={{ scale: 1.005 }} className="tf-card overflow-hidden rounded-2xl">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead>
            <tr className="text-xs uppercase text-gray-500 border-b border-[var(--tf-border)]">
              {["ID", "Name", "Type", "Status", "Last Run"].map((h) => (
                <th key={h} className="px-6 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <motion.tr
                key={t.id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                className="border-t border-[var(--tf-border)]"
              >
                <td className="px-6 py-3 text-[var(--tf-accent)]">{String(t.id).slice(0, 8)}</td>
                <td className="px-6 py-3">{t.name}</td>
                <td className="px-6 py-3 text-gray-400">{t.type}</td>
                <td className="px-6 py-3">{statusBadge(t.status)}</td>
                <td className="px-6 py-3 text-gray-400">
                  {t.last_run ? new Date(t.last_run).toLocaleString() : "—"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
