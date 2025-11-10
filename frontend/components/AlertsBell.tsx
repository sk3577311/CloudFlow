// app/components/AlertsBell.tsx
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
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // keep last known summary; do not spam
        return;
      }
      const data: AlertSummary = await res.json();
      setSummary(data);

      // If alert flipped from false -> true, show a toast once
      if (data.active && !prevActive.current) {
        toast.error(`Alerts active: ${data.message}`, { duration: 6000 });
      }

      prevActive.current = !!data.active;
    } catch (err) {
      // silent fail; optionally show console
      console.error("Failed to fetch alerts summary:", err);
    }
  }

  useEffect(() => {
    // initial fetch
    fetchSummary();

    // poll every 30s
    intervalRef.current = window.setInterval(fetchSummary, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const badgeCount = summary ? (summary.dlq_count || summary.failed_jobs ? Math.max(summary.dlq_count, summary.failed_jobs) : 0) : 0;

  return (
    <div className="relative">
      <button
        aria-label="Alerts"
        onClick={() => {
          setOpen((s) => !s);
          // immediate refresh when user opens
          fetchSummary();
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {summary && summary.active && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium leading-none text-white bg-red-500 rounded-full">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <div className="text-sm font-medium">
                {summary?.active ? "Active Alerts" : "No Active Alerts"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {summary ? summary.message : "Loading..."}
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Failed jobs</span>
              <span>{summary?.failed_jobs ?? "—"}</span>
            </div>
            <div className="flex justify-between text-gray-600 mt-1">
              <span>DLQ</span>
              <span>{summary?.dlq_count ?? "—"}</span>
            </div>
          </div>

          <div className="mt-3">
            <a
              href="/dashboard/jobs" // or a dedicated alerts page if you have one
              className="block text-center text-sm text-indigo-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              View Jobs / DLQ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
