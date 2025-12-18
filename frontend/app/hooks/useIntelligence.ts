"use client";
import { useEffect, useState } from "react";
import useMetricsSocket from "./useMetricsSocket";

interface AuditLog {
  id: number;
  event: string;
  created_at: string;
  meta?: Record<string, any>;
}

export default function useIntelligence() {
  const { forecasts, anomalies } = useMetricsSocket();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch persisted logs (Phase 3 backend)
  const refreshAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/intelligence/audit`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    refreshAudit();
  }, []);

  return {
    cpuForecast: forecasts.cpu || [],
    memoryForecast: forecasts.memory || [],
    anomalies,
    auditLogs,
    loading,
    refreshAudit,
  };
}
