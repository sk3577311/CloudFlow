"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Database,
  X,
  TrendingUp,
  Plus,
  Repeat,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import SkeletonCard from "@/components/SkeletonCard";
import { toast } from "sonner";

interface Job {
  id: string;
  task: string;
  status: "queued" | "completed" | "failed" | string;
  created_at?: string;
  priority?: string;
}

interface Stats {
  total: number;
  queued: number;
  completed: number;
  failed: number;
}

// ------------------------------------------------------
// JOB DETAIL MODAL
// ------------------------------------------------------
function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  if (!job) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl w-full max-w-md p-6 relative transition-colors"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Job Details</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>ID:</strong> {job.id}
          </p>
          <p>
            <strong>Task:</strong> {job.task}
          </p>
          <p>
            <strong>Status:</strong> {job.status}
          </p>
          <p>
            <strong>Created:</strong> {job.created_at ?? "--"}
          </p>
          <p>
            <strong>Priority:</strong> {job.priority ?? "Normal"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------
// CREATE JOB MODAL
// ------------------------------------------------------
function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [task, setTask] = useState("");
  const [payload, setPayload] = useState('{"to": "test@example.com"}');
  const [delay, setDelay] = useState("");
  const [cron, setCron] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("medium");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let parsedPayload = {};
    try {
      parsedPayload = payload.trim() ? JSON.parse(payload) : {};
    } catch {
      toast.error('Invalid JSON in payload. Example: { "to": "test@example.com" }');
      return;
    }

    const body: Record<string, any> = { task, payload: parsedPayload, priority };
    if (delay) body.delay = parseInt(delay);
    if (cron) body.cron = cron;
    if (callbackUrl) body.callback_url = callbackUrl;

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs`, {
        method: "POST",
        headers: {
          "x-api-key": "supersecret123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      toast.success("✅ Job queued successfully!");
      onCreated();
      onClose();
    } catch {
      toast.error("❌ Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative transition-colors"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Create New Job</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Task</label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
              className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            >
              <option value="">Select task</option>
              <option value="send_email">Send Email</option>
              <option value="generate_report">Generate Report</option>
              <option value="cleanup_temp">Cleanup Temp</option>
              <option value="custom_task">Custom Task</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            >
              <option value="high">High 🚀</option>
              <option value="medium">Medium ⚙️</option>
              <option value="low">Low 💤</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Payload (JSON)</label>
            <textarea
              rows={4}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg p-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Delay (seconds)</label>
              <input
                type="number"
                min="0"
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cron (seconds)</label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="e.g. 60 or Leave blank if one-time job"
                className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Callback URL (optional)</label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Job
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------
// JOB LOGS MODAL
// ------------------------------------------------------
function JobLogsModal({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const [logs, setLogs] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/${jobId}/logs`, {
      headers: { "x-api-key": "supersecret123" },
    })
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
        setResult(data.result);
      })
      .catch(() => {
        setLogs("");
        setResult("");
      });
  }, [jobId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative transition-colors"
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Job Logs</h2>
        <pre className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-100 overflow-y-auto max-h-96 whitespace-pre-wrap">
          {logs || "No logs yet..."}
        </pre>

        {result && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
            {result}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------
// MAIN JOBS PAGE
// ------------------------------------------------------
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dlqJobs, setDlqJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<"jobs" | "dlq">("jobs");
  const [stats, setStats] = useState<Stats>({ total: 0, queued: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // lightweight system theme sync
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)").matches : false
  );

  function openLogs(id: number) {
    setSelectedJobId(id);
    setShowLogsModal(true);
  }
  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs`, {
        headers: { "x-api-key": "supersecret123" },
      });
      const data: Job[] = await res.json();
      setJobs(data);

      const grouped = data.reduce((acc: any, job: Job) => {
        const time = new Date(job.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (!acc[time]) acc[time] = { time, completed: 0, failed: 0 };
        if (job.status === "completed") acc[time].completed++;
        if (job.status === "failed") acc[time].failed++;
        return acc;
      }, {});
      setChartData(Object.values(grouped));
      setStats({
        total: data.length,
        queued: data.filter((j) => j.status === "queued").length,
        completed: data.filter((j) => j.status === "completed").length,
        failed: data.filter((j) => j.status === "failed").length,
      });
    } catch {
      toast.error("❌ Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDLQ() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/dead-letter`, {
        headers: { "x-api-key": "supersecret123" },
      });
      const data = await res.json();
      setDlqJobs(data.jobs || []);
    } catch {
      toast.error("❌ Failed to load Dead Letter Queue");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetryFailed() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/retry-failed`, {
        method: "POST",
        headers: { "x-api-key": "supersecret123" },
      });
      const data = await res.json();
      toast.success(`✅ ${data.message}`);
      fetchJobs();
    } catch {
      toast.error("❌ Could not retry failed jobs");
    }
  }

  useEffect(() => {
    if (activeTab === "jobs") fetchJobs();
    else fetchDLQ();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      default: "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-200",
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[status] || colors.default}`}>
        {status}
      </span>
    );
  };

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      medium: "bg-blue-100 text-blue-700 dark:bg-indigo-900/40 dark:text-indigo-300",
      low: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300",
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[priority] || colors.medium}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6 bg-neutral-50 dark:bg-[#1c1c1f] min-h-screen transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-500" /> Jobs Dashboard
        </h1>
        <div className="flex gap-3">
          {activeTab === "jobs" && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 transition"
              >
                <Plus className="w-5 h-5" /> New Job
              </button>
              <button
                onClick={handleRetryFailed}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white shadow-sm hover:bg-red-600 transition"
              >
                <Repeat className="w-5 h-5" /> Retry Failed
              </button>
            </>
          )}
          <button
            onClick={() => (activeTab === "jobs" ? fetchJobs() : fetchDLQ())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-indigo-500" : "text-gray-700 dark:text-gray-200"}`} />
            <span className="text-gray-700 dark:text-gray-200">{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-neutral-800">
        <button
          className={`pb-2 text-sm font-medium ${activeTab === "jobs"
            ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-300"
            : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300"}`}
          onClick={() => setActiveTab("jobs")}
        >
          Active Jobs
        </button>
        <button
          className={`pb-2 text-sm font-medium ${activeTab === "dlq"
            ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-300"
            : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300"}`}
          onClick={() => setActiveTab("dlq")}
        >
          Dead Letter Queue
        </button>
      </div>

      {/* TABLES + METRICS */}
      {activeTab === "jobs" ? (
        <>
          {/* Metrics */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: "Total Jobs", value: stats.total, color: "from-indigo-500 to-indigo-600" },
                { label: "Queued", value: stats.queued, color: "from-yellow-400 to-amber-500" },
                { label: "Completed", value: stats.completed, color: "from-green-500 to-emerald-600" },
                { label: "Failed", value: stats.failed, color: "from-red-500 to-rose-600" },
              ].map((c) => (
                <motion.div
                  key={c.label}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-sm dark:shadow-md transition-transform`}
                >
                  <h2 className="text-sm opacity-80 mb-2">{c.label}</h2>
                  <p className="text-4xl font-bold">{c.value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm dark:shadow-md mb-10 transition-colors">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Job Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2b3036" : "#e6e7eb"} />
                <XAxis dataKey="time" stroke={isDark ? "#94a3b8" : "#6b7280"} />
                <YAxis stroke={isDark ? "#94a3b8" : "#6b7280"} />
                <Tooltip
                  wrapperStyle={{
                    background: isDark ? "#0b0b0b" : "#fff",
                    border: `1px solid ${isDark ? "#2b3036" : "#e6e7eb"}`,
                    color: isDark ? "#e6eef6" : undefined,
                  }}
                />
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
                  <th className="px-6 py-3 font-medium">Task</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Logs</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <motion.tr
                    key={j.id}
                    whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB" }}
                    onClick={() => setSelectedJob(j)}
                    className="border-t border-gray-100 dark:border-neutral-800 cursor-pointer"
                  >
                    <td className="px-6 py-3 text-indigo-600 font-medium">{String(j.id).slice(0, 8)}</td>
                    <td className="px-6 py-3">{j.task}</td>
                    <td className="px-6 py-3">{priorityBadge(j.priority || "medium")}</td>
                    <td className="px-6 py-3">{statusBadge(j.status)}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                      {j.created_at ? new Date(j.created_at).toLocaleTimeString() : "--"}
                    </td>
                    <td
                      className="px-6 py-3 text-indigo-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLogs(Number(j.id));
                      }}
                    >
                      View Logs
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        // DLQ Table
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-md overflow-hidden transition-colors">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Dead Letter Queue
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{dlqJobs.length} jobs</p>
          </div>
          <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-200">
            <thead className="bg-gray-100 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dlqJobs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 dark:text-gray-400 py-6">
                    🎉 No dead-letter jobs
                  </td>
                </tr>
              ) : (
                dlqJobs.map((j) => (
                  <motion.tr
                    key={j.id}
                    whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB" }}
                    onClick={() => setSelectedJob(j)}
                    className="border-t border-gray-100 dark:border-neutral-800 cursor-pointer"
                  >
                    <td className="px-6 py-3 text-red-600 font-medium">{String(j.id).slice(0, 8)}</td>
                    <td className="px-6 py-3">{j.task}</td>
                    <td className="px-6 py-3">{statusBadge("failed")}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
        {showCreateModal && <CreateJobModal onClose={() => setShowCreateModal(false)} onCreated={fetchJobs} />}
        {showLogsModal && selectedJobId && <JobLogsModal jobId={selectedJobId} onClose={() => setShowLogsModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
