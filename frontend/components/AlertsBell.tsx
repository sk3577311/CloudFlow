"use client";
import React, { useEffect, useState, useRef } from "react";
import { Bell, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AlertSummary {
  active: boolean;
  failed_jobs: number;
  dlq_count: number;
  message: string;
}

export default function AlertsBell() {
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [open, setOpen] = useState(false);
  const prevActive = useRef<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  const API = `${process.env.NEXT_PUBLIC_API_BASE_URL}/alerts/summary`;

  async function fetchSummary() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(API, {
        headers: {
          "x-api-key": "supersecret123",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) return;
      const data: AlertSummary = await res.json();
      setSummary(data);

      if (data.active && !prevActive.current) {
        toast.error(`Alerts active: ${data.message}`, { duration: 6000 });
      }
      prevActive.current = !!data.active;
    } catch (err) {
      console.error("Failed to fetch alerts summary:", err);
    }
  }

  useEffect(() => {
    fetchSummary();

    const id = window.setInterval(fetchSummary, 30000);
    intervalRef.current = id;

    return () => clearInterval(id);
  }, []);

  const badgeCount = summary ? Math.max(summary.dlq_count || 0, summary.failed_jobs || 0) : 0;

  return (
    <div className="relative">
      <button
        aria-label="Alerts"
        onClick={() => { setOpen((s) => !s); fetchSummary(); }}
        className="relative p-2 rounded-xl bg-[#1E1F22] hover:bg-[#2a2c2f] transition"
      >
        <Bell className="w-5 h-5 text-white opacity-80" />
        {summary?.active && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-[#FF6A6A] text-white rounded-full">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 tf-card rounded-[22px] p-4 z-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF6A6A]" />
            <div>
              <div className="text-sm font-semibold text-white">
                {summary?.active ? "Active Alerts" : "No Active Alerts"}
              </div>
              <div className="text-xs text-[var(--tf-text-dim)] mt-1">
                {summary?.message ?? "Loading..."}
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm">
            <div className="flex justify-between text-[var(--tf-text-dim)]">
              <span>Failed jobs</span>
              <span>{summary?.failed_jobs ?? "—"}</span>
            </div>
            <div className="flex justify-between text-[var(--tf-text-dim)] mt-1">
              <span>DLQ</span>
              <span>{summary?.dlq_count ?? "—"}</span>
            </div>
          </div>

          <div className="mt-4">
            <a href="/dashboard/jobs" className="block text-center text-[var(--tf-accent)] hover:underline">
              View Jobs / DLQ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
