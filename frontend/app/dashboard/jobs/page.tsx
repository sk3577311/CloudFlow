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
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Job Details</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>ID:</strong> {job.id}</p>
          <p><strong>Task:</strong> {job.task}</p>
          <p><strong>Status:</strong> {job.status}</p>
          <p><strong>Created:</strong> {job.created_at ?? "--"}</p>
          <p><strong>Priority:</strong> {job.priority ?? "Normal"}</p>
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
  const [payload, setPayload] = useState("{\"to\": \"test@example.com\"}");
  const [delay, setDelay] = useState("");
  const [cron, setCron] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let parsedPayload = {};
    try {
      parsedPayload = payload.trim() ? JSON.parse(payload) : {};
    } catch {
      toast.error("Invalid JSON in payload. Example: { \"to\": \"test@example.com\" }");
      return;
    }

    const body: Record<string, any> = { task, payload: parsedPayload };
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
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Job</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select task</option>
              <option value="send_email">Send Email</option>
              <option value="generate_report">Generate Report</option>
              <option value="cleanup_temp">Cleanup Temp</option>
              <option value="custom_task">Custom Task</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payload (JSON)</label>
            <textarea
              rows={4}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay (seconds)</label>
              <input
                type="number"
                min="0"
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cron (seconds)</label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="e.g. 60"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Callback URL (optional)</label>
            <input
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 flex justify-center items-center gap-2 transition"
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
  }, [activeTab]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      queued: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      default: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[status] || colors.default}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-500" /> Jobs Dashboard
        </h1>
        <div className="flex gap-3">
          {activeTab === "jobs" && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white shadow hover:bg-indigo-600 transition"
              >
                <Plus className="w-5 h-5" /> New Job
              </button>
              <button
                onClick={handleRetryFailed}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white shadow hover:bg-red-600 transition"
              >
                <Repeat className="w-5 h-5" /> Retry Failed
              </button>
            </>
          )}
          <button
            onClick={() => (activeTab === "jobs" ? fetchJobs() : fetchDLQ())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow hover:shadow-md transition"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading ? "animate-spin text-indigo-500" : "text-gray-700"}`}
            />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          className={`pb-2 text-sm font-medium ${activeTab === "jobs"
            ? "border-b-2 border-indigo-500 text-indigo-600"
            : "text-gray-500 hover:text-indigo-600"}`}
          onClick={() => setActiveTab("jobs")}
        >
          Active Jobs
        </button>
        <button
          className={`pb-2 text-sm font-medium ${activeTab === "dlq"
            ? "border-b-2 border-indigo-500 text-indigo-600"
            : "text-gray-500 hover:text-indigo-600"}`}
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
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: "Total Jobs", value: stats.total, color: "from-indigo-500 to-indigo-600" },
                { label: "Queued", value: stats.queued, color: "from-yellow-400 to-amber-500" },
                { label: "Completed", value: stats.completed, color: "from-green-500 to-emerald-600" },
                { label: "Failed", value: stats.failed, color: "from-red-500 to-rose-600" },
              ].map((c) => (
                <motion.div key={c.label} whileHover={{ scale: 1.02 }} className={`p-6 rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg`}>
                  <h2 className="text-sm opacity-80 mb-2">{c.label}</h2>
                  <p className="text-4xl font-bold">{c.value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl shadow mb-10">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Job Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Task</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <motion.tr
                    key={j.id}
                    whileHover={{ backgroundColor: "#F9FAFB" }}
                    onClick={() => setSelectedJob(j)}
                    className="border-t cursor-pointer"
                  >
                    <td className="px-6 py-3 text-indigo-600 font-medium">{String(j.id).slice(0, 8)}</td>
                    <td className="px-6 py-3">{j.task}</td>
                    <td className="px-6 py-3">{statusBadge(j.status)}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {j.created_at ? new Date(j.created_at).toLocaleTimeString() : "--"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        // DLQ Table
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Dead Letter Queue
            </h2>
            <p className="text-gray-500 text-sm">{dlqJobs.length} jobs</p>
          </div>
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dlqJobs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-6">
                    🎉 No dead-letter jobs
                  </td>
                </tr>
              ) : (
                dlqJobs.map((j) => (
                  <motion.tr
                    key={j.id}
                    whileHover={{ backgroundColor: "#F9FAFB" }}
                    onClick={() => setSelectedJob(j)}
                    className="border-t cursor-pointer"
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
      </AnimatePresence>
    </div>
  );
}
