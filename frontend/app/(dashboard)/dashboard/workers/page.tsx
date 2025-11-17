"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Cpu,
  Activity,
  Power,
  Clock,
  RefreshCw,
  RotateCcw,
  ChevronDown,
  Signal,
  TrendingUp,
  Database,
} from "lucide-react";
import { toast } from "sonner";

interface Worker {
  id: string | number;
  name: string;
  status: string;
  current_job?: string;
  uptime?: number;
  last_heartbeat?: string;
}

interface MetricsPayload {
  cpu: number;
  memory: number;
  queues: Record<string, number>;
  workers: {
    total: number;
    active: number;
    idle: number;
  };
}

const COLORS = {
  active: "#10B981",
  idle: "#FBBF24",
  offline: "#EF4444",
};

export default function PremiumWorkersDashboard() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  const WS_BASE =
    process.env.NEXT_PUBLIC_API_BASE_WS || "ws://127.0.0.1:8000/ws/metrics";

  const wsRef = useRef<WebSocket | null>(null);

  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("—");
  const [selectedScale, setSelectedScale] = useState(1);
  const [scaling, setScaling] = useState(false);

  // 🧠 Fetch initial workers list
  async function fetchWorkers() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/workers/`, {
        headers: { "x-api-key": "supersecret123" },
      });
      const data = await res.json();
      setWorkers(data);
      setLoading(false);
    } catch (e) {
      console.warn("Failed to fetch workers", e);
      setLoading(false);
    }
  }

  // ⚡ Real-time metrics via WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;
    ws.onopen = () => console.log("✅ WS connected →", WS_BASE);
    ws.onclose = () => console.warn("⚠️ WS closed");
    ws.onerror = (e) => console.error("❌ WS error", e);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "metrics") {
          setMetrics(msg.data);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, []);

  // 📈 Update chart dynamically with time series
  useEffect(() => {
    if (!metrics) return;
    const now = new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
    setChartData((prev) => {
      const next = [
        ...prev,
        { time: now, cpu: metrics.cpu, memory: metrics.memory },
      ];
      return next.slice(-12);
    });
  }, [metrics]);

  const pieData = useMemo(() => {
    const active = metrics?.workers?.active || 0;
    const idle = metrics?.workers?.idle || 0;
    const total = metrics?.workers?.total || 0;
    const offline = Math.max(0, total - active - idle);
    return [
      { name: "Active", value: active, color: COLORS.active },
      { name: "Idle", value: idle, color: COLORS.idle },
      { name: "Offline", value: offline, color: COLORS.offline },
    ];
  }, [metrics]);

  const healthIndex = useMemo(() => {
    if (!metrics) return 0;
    const { total, active } = metrics.workers;
    return total > 0 ? Math.round((active / total) * 100) : 0;
  }, [metrics]);

  async function restartWorker() {
    try {
      toast.loading("Restarting worker...");
      await fetch(`${API_BASE}/workers/restart/`, {
        method: "POST",
        headers: { "x-api-key": "supersecret123" },
      });
      toast.success("✅ Worker restarted successfully");
      fetchWorkers();
    } catch {
      toast.error("❌ Restart failed");
    } finally {
      toast.dismiss();
    }
  }

  async function scaleWorkers(count: number) {
    try {
      setScaling(true);
      await fetch(`${API_BASE}/workers/scale?count=${count}`, {
        method: "POST",
        headers: { "x-api-key": "supersecret123" },
      });
      toast.success(`✅ Scaled to ${count} worker${count > 1 ? "s" : ""}`);
      fetchWorkers();
    } catch {
      toast.error("❌ Scaling failed");
    } finally {
      setScaling(false);
    }
  }

  return (
    <div className="p-6 bg-[var(--tf-bg)] min-h-screen transition-colors text-gray-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">⚙️ TaskFlow Cloud — Worker Metrics</h1>
          <p className="text-sm text-[var(--tf-text-dim)] mt-1">
            Live metrics, worker states, and system insights
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <div className="text-xs text-[var(--tf-text-dim)]">Last: {lastUpdate}</div>
          <button
            onClick={restartWorker}
            className="px-4 py-2 bg-[var(--tf-text-dim)] text-white rounded-xl hover:opacity-90 transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4 inline-block mr-2" /> Restart Worker
          </button>
          <div className="relative">
            <select
              value={selectedScale}
              onChange={(e) => scaleWorkers(Number(e.target.value))}
              disabled={scaling}
              className="appearance-none cursor-pointer px-4 py-2 rounded-xl border tf-card pr-8"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} Worker{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div whileHover={{ scale: 1.02 }} className="tf-card p-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[var(--tf-text-dim)]">CPU Usage</div>
              <div className="text-3xl font-semibold mt-1">{metrics?.cpu?.toFixed(1) || 0}%</div>
            </div>
            <Cpu className="w-8 h-8 text-[var(--tf-accent)]" />
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="tf-card p-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[var(--tf-text-dim)]">Memory Usage</div>
              <div className="text-3xl font-semibold mt-1">{metrics?.memory?.toFixed(1) || 0}%</div>
            </div>
            <Database className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="tf-card p-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[var(--tf-text-dim)]">Active Workers</div>
              <div className="text-3xl font-semibold mt-1">{metrics?.workers?.active || 0}</div>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="tf-card p-6 rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[var(--tf-text-dim)]">Queue Depth</div>
              <div className="text-3xl font-semibold mt-1">
                {Object.values(metrics?.queues || {}).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* HEALTH BAR */}
      <motion.div whileHover={{ scale: 1.01 }} className="tf-card p-6 rounded-2xl mb-10">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-[var(--tf-text-dim)]">Cluster Health Index</div>
            <div className="text-4xl font-semibold mt-1">{healthIndex}%</div>
          </div>
          <Cpu className="w-10 h-10 text-[var(--tf-accent)]" />
        </div>
        <div className="mt-4 h-3 bg-[var(--tf-card)] rounded-full overflow-hidden border border-[var(--tf-border)]">
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${healthIndex}%`,
              background: "linear-gradient(90deg,var(--tf-accent),#9fe9ee)",
            }}
          />
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <motion.div whileHover={{ scale: 1.01 }} className="tf-card p-6 rounded-2xl col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--tf-accent)]" /> Resource Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: "var(--tf-card)", border: "1px solid var(--tf-border)" }} />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#EC4899" strokeWidth={3} />
              <Line type="monotone" dataKey="memory" stroke="#14B8A6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} className="tf-card p-6 rounded-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Signal className="w-5 h-5 text-[var(--tf-accent)]" /> Worker Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Worker Table */}
      <motion.div whileHover={{ scale: 1.005 }} className="tf-card p-4 rounded-2xl">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead>
            <tr className="text-xs uppercase text-gray-500 border-b border-[var(--tf-border)]">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Current Job</th>
              <th className="px-4 py-3">Uptime</th>
              <th className="px-4 py-3">Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <motion.tr
                key={w.id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                className="border-t border-[var(--tf-border)]"
              >
                <td className="px-4 py-3 text-[var(--tf-accent)]">{String(w.id).slice(0, 8)}</td>
                <td className="px-4 py-3">{w.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      w.status === "active"
                        ? "bg-green-500/20 text-green-300"
                        : w.status === "idle"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{w.current_job || "—"}</td>
                <td className="px-4 py-3 text-gray-400">
                  {w.uptime ? `${(w.uptime / 60).toFixed(1)} min` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {w.last_heartbeat ? new Date(w.last_heartbeat).toLocaleTimeString() : "—"}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
