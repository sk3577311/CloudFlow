'use client';

import { useEffect, useState } from "react";
import { useRefresh } from '@/lib/refreshContext';
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
    const { subscribe, startLoading, stopLoading } = useRefresh(); // 🧩 Hook into refresh system
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState("");
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
                    "Content-Type": "application/json",
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

            // Chart data
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
            setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
            console.error(error);
            showToast("❌ Failed to fetch jobs!", "error");
        } finally {
            setLoading(false);
            stopLoading();
        }
    }

    // 🔁 Subscribe to global refresh
    useEffect(() => {
        const unsubscribe = subscribe(() => fetchJobs(true));
        fetchJobs();
        return unsubscribe;
    }, [subscribe, accessToken]);

    // 💻 Fetch System Metrics
    async function fetchSystemMetrics() {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/system/metrics`, {
                headers: {
                    "x-api-key": "supersecret123",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch system metrics");
            const data: SystemMetrics = await res.json();

            setCpuData((prev) => [
                ...prev.slice(-19),
                { time: new Date().toLocaleTimeString(), value: data.cpu_percent },
            ]);
            setMemoryData((prev) => [
                ...prev.slice(-19),
                { time: new Date().toLocaleTimeString(), value: data.memory_percent },
            ]);
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
                    "Content-Type": "application/json",
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
        <>
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
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition`}
                        >
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
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
                        className={`px-3 py-1 rounded-full border ${filter === f ? "bg-indigo-500 text-white" : "bg-white text-gray-700"}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
                {/* Job Completion Line Chart */}
                <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2 hover:shadow-lg transition">
                    <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 mb-4">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Job Completion Trend
                    </h2>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="time" stroke="#6B7280" />
                            <YAxis stroke="#6B7280" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                            <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} dot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Job Status Pie Chart */}
                <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                    <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 mb-4">
                        <Activity className="w-5 h-5 text-green-500" />
                        Job Status Breakdown
                    </h2>
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                {/* CPU */}
                <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                    <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 mb-4">
                        <Cpu className="w-5 h-5 text-pink-500" />
                        CPU Usage %
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={cpuData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="time" stroke="#6B7280" />
                            <YAxis stroke="#6B7280" />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#EC4899" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Memory */}
                <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                    <h2 className="text-lg font-medium flex items-center gap-2 text-gray-800 mb-4">
                        <Monitor className="w-5 h-5 text-teal-500" />
                        Memory Usage %
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={memoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="time" stroke="#6B7280" />
                            <YAxis stroke="#6B7280" />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="mt-10 bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                <h2 className="text-lg font-medium mb-4">Jobs Overview</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-6 py-3 text-left">ID</th>
                                <th className="px-6 py-3 text-left">Task</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-left">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map((j) => (
                                <tr
                                    key={j.id}
                                    className="border-t cursor-pointer hover:bg-gray-100"
                                    onClick={() => setSelectedJob(j)}
                                >
                                    <td className="px-6 py-3 text-indigo-600 font-medium">{String(j.id).slice(0, 8)}</td>
                                    <td className="px-6 py-3">{j.task}</td>
                                    <td className="px-6 py-3">{j.status}</td>
                                    <td className="px-6 py-3">{new Date(j.created_at || "").toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Job Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-lg p-6 relative">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={() => setSelectedJob(null)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Job Details</h2>
                        <div className="flex flex-col gap-2 mb-4">
                            <p><span className="font-semibold">ID:</span> {selectedJob.id}</p>
                            <p><span className="font-semibold">Task:</span> {selectedJob.task}</p>
                            <p><span className="font-semibold">Status:</span> {selectedJob.status}</p>
                            <p><span className="font-semibold">Created At:</span> {new Date(selectedJob.created_at || "").toLocaleString()}</p>
                            <p><span className="font-semibold">Updated At:</span> {selectedJob.updated_at ? new Date(selectedJob.updated_at).toLocaleString() : "-"}</p>
                        </div>

                        {/* Status Timeline */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">Status Timeline:</h3>
                            <ul className="flex flex-col gap-1">
                                {selectedJob.history?.map((h, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span
                                            className={`w-3 h-3 rounded-full ${h.status === "queued" ? "bg-yellow-500" :
                                                h.status === "processing" ? "bg-blue-500" :
                                                    h.status === "completed" ? "bg-green-500" :
                                                        h.status === "failed" ? "bg-red-500" : "bg-gray-500"
                                                }`}
                                        ></span>
                                        <span className="font-medium">{h.status}</span>
                                        <span className="text-gray-500 text-sm">{new Date(h.time).toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selectedJob.status === "failed" && (
                            <button
                                onClick={() => retryFailedJobs(selectedJob.id)}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition ${retrying ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={retrying}
                            >
                                <Repeat className="w-5 h-5" />
                                {retrying ? "Retrying..." : "Retry Job"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
