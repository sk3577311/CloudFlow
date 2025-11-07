"use client";

import { useEffect, useState } from "react";
import { useRefresh } from "@/lib/refreshContext";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Layers,
  Repeat,
  Cpu,
  Monitor,
  X,
} from "lucide-react";
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
import { showToast } from "@/components/Toast";
import SkeletonCard from "@/components/SkeletonCard";

interface Job {
  id: string;
  task: string;
  status: "queued" | "completed" | "failed" | "processing" | string;
  created_at?: string;
  updated_at?: string;
  history?: { status: string; time: string }[];
}

interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
}

export default function DashboardContent() {
  const { subscribe, startLoading, stopLoading } = useRefresh();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [cpuData, setCpuData] = useState<{ time: string; value: number }[]>([]);
  const [memoryData, setMemoryData] = useState<{ time: string; value: number }[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [retrying, setRetrying] = useState(false);

  // 🔑 Load JWT token
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAccessToken(localStorage.getItem("access_token"));
    }
  }, []);

  // 🧠 Fetch Jobs
  async function fetchJobs(triggeredByRefresh = false) {
    try {
      if (!triggeredByRefresh) setLoading(true);
      startLoading();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs`, {
        headers: {
          "x-api-key": "supersecret123",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data: Job[] = await res.json();
      const enrichedJobs = data.map((job) => ({
        ...job,
        history: [
          { status: "queued", time: job.created_at || "" },
          ...(job.status !== "queued"
            ? [{ status: job.status, time: job.updated_at || "" }]
            : []),
        ],
      }));
      setJobs(enrichedJobs);

      const grouped = data.reduce((acc: any, job: Job) => {
        const time = new Date(job.created_at || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (!acc[time]) acc[time] = { time, completed: 0, failed: 0 };
        if (job.status === "completed") acc[time].completed++;
        if (job.status === "failed") acc[time].failed++;
        return acc;
      }, {});
      setChartData(Object.values(grouped));
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
    return unsub;
  }, [subscribe, accessToken]);

  // 💻 Fetch System Metrics
  async function fetchSystemMetrics() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/system/metrics`, {
        headers: {
          "x-api-key": "supersecret123",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data: SystemMetrics = await res.json();
      setCpuData((prev) => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), value: data.cpu_percent }]);
      setMemoryData((prev) => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), value: data.memory_percent }]);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // 🧾 Retry Jobs
  async function retryFailedJobs(jobId?: string) {
    try {
      setRetrying(true);
      const endpoint = jobId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/retry/${jobId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/retry-failed`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": "supersecret123",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to retry jobs");
      const data = await res.json();
      showToast(`✅ ${data.message}`, "success");
      fetchJobs();
    } catch (err) {
      console.error(err);
      showToast("❌ Could not retry jobs", "error");
    } finally {
      setRetrying(false);
    }
  }

  // 🧩 Metrics
  const total = jobs.length;
  const queued = jobs.filter((j) => j.status === "queued").length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const processing = jobs.filter((j) => j.status === "processing").length;

  const avgProcessingTime =
    jobs
      .filter((j) => j.status === "completed" && j.created_at && j.updated_at)
      .map((j) => new Date(j.updated_at!).getTime() - new Date(j.created_at!).getTime())
      .reduce((a, b) => a + b, 0) / Math.max(1, completed) / 1000;

  const metricCards = [
    { label: "Total Jobs", value: total, icon: <Layers className="w-6 h-6" />, color: "from-indigo-500 to-indigo-600" },
    { label: "Queued", value: queued, icon: <Clock className="w-6 h-6" />, color: "from-yellow-400 to-yellow-500" },
    { label: "Completed", value: completed, icon: <CheckCircle2 className="w-6 h-6" />, color: "from-green-500 to-emerald-600" },
    { label: "Failed", value: failed, icon: <AlertTriangle className="w-6 h-6" />, color: "from-red-500 to-rose-600" },
    { label: "Avg Proc (s)", value: avgProcessingTime.toFixed(1), icon: <Activity className="w-6 h-6" />, color: "from-purple-500 to-purple-600" },
    { label: "CPU %", value: cpuData.at(-1)?.value ?? 0, icon: <Cpu className="w-6 h-6" />, color: "from-pink-500 to-pink-600" },
    { label: "Memory %", value: memoryData.at(-1)?.value ?? 0, icon: <Monitor className="w-6 h-6" />, color: "from-teal-500 to-teal-600" },
  ];

  const pieData = [
    { name: "Completed", value: completed, color: "#10B981" },
    { name: "Failed", value: failed, color: "#EF4444" },
    { name: "Queued", value: queued, color: "#F59E0B" },
    { name: "Processing", value: processing, color: "#3B82F6" },
  ];

  const filteredJobs = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <div className="transition-colors duration-300">
      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 mb-12">
          {[...Array(7)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 mb-12">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition dark:shadow-indigo-900/40`}
            >
              <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-sm" />
              <div className="relative p-6 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">{card.label}</span>
                  {card.icon}
                </div>
                <h2 className="text-3xl font-semibold">{card.value}</h2>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {["all", "queued", "processing", "completed", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full border transition ${
              filter === f
                ? "bg-indigo-500 text-white"
                : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-neutral-900 dark:to-neutral-800 rounded-2xl shadow-md p-6 lg:col-span-2 transition">
          <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 dark:text-gray-100 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Job Completion Trend
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{
                background: "#1F2937",
                color: "#F9FAFB",
                borderRadius: "0.5rem",
                border: "none",
              }} />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gradient-to-b dark:from-neutral-900 dark:to-neutral-800 rounded-2xl shadow-md p-6 transition">
          <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 dark:text-gray-100 mb-4">
            <Activity className="w-5 h-5 text-green-500" /> Job Status Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{
                background: "#1F2937",
                color: "#F9FAFB",
                borderRadius: "0.5rem",
                border: "none",
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        {[
          { title: "CPU Usage %", data: cpuData, color: "#EC4899", icon: <Cpu className="w-5 h-5 text-pink-500" /> },
          { title: "Memory Usage %", data: memoryData, color: "#14B8A6", icon: <Monitor className="w-5 h-5 text-teal-500" /> },
        ].map((m) => (
          <div key={m.title} className="bg-white dark:bg-gradient-to-b dark:from-neutral-900 dark:to-neutral-800 rounded-2xl shadow-md p-6 transition">
            <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 dark:text-gray-100 mb-4">
              {m.icon} {m.title}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={m.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{
                  background: "#1F2937",
                  color: "#F9FAFB",
                  borderRadius: "0.5rem",
                  border: "none",
                }} />
                <Line type="monotone" dataKey="value" stroke={m.color} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-md p-6 transition">
        <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">Jobs Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-700 border-b border-gray-200 dark:border-neutral-700">
                <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-200">ID</th>
                <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-200">Task</th>
                <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-200">Status</th>
                <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-200">Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-t border-gray-100 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700/50 cursor-pointer transition"
                  onClick={() => setSelectedJob(j)}
                >
                  <td className="px-6 py-3 text-indigo-600 dark:text-indigo-400 font-medium">{String(j.id).slice(0, 8)}</td>
                  <td className="px-6 py-3 text-gray-800 dark:text-gray-100">{j.task}</td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{j.status}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{new Date(j.created_at || "").toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-11/12 max-w-lg p-6 relative transition">
            <button
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setSelectedJob(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Job Details</h2>

            <div className="flex flex-col gap-2 mb-4 text-gray-700 dark:text-gray-300">
              <p><span className="font-semibold">ID:</span> {selectedJob.id}</p>
              <p><span className="font-semibold">Task:</span> {selectedJob.task}</p>
              <p><span className="font-semibold">Status:</span> {selectedJob.status}</p>
              <p><span className="font-semibold">Created At:</span> {new Date(selectedJob.created_at || "").toLocaleString()}</p>
              <p><span className="font-semibold">Updated At:</span> {selectedJob.updated_at ? new Date(selectedJob.updated_at).toLocaleString() : "-"}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Status Timeline:</h3>
              <ul className="flex flex-col gap-1">
                {selectedJob.history?.map((h, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        h.status === "queued"
                          ? "bg-yellow-500"
                          : h.status === "processing"
                          ? "bg-blue-500"
                          : h.status === "completed"
                          ? "bg-green-500"
                          : h.status === "failed"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className="font-medium">{h.status}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(h.time).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedJob.status === "failed" && (
              <button
                onClick={() => retryFailedJobs(selectedJob.id)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition ${
                  retrying ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={retrying}
              >
                <Repeat className="w-5 h-5" />
                {retrying ? "Retrying..." : "Retry Job"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
