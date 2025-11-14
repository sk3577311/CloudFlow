import { useEffect, useRef, useState } from "react";

type Forecast = { ts: number; value: number }[];
type Anomaly = { target: string; ts: number; value: number; severity: string };
type Audit = { event: string; created_at: Date; meta?: Record<string, any> };

function isReloaderRoute() {
  try {
    return typeof window !== "undefined" && window.location.pathname.startsWith("/reloading/");
  } catch {
    return false;
  }
}

export default function useMetricsSocket(url?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [forecasts, setForecasts] = useState<Record<string, Forecast>>({});
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [auditLogs, setAuditLogs] = useState<Audit[]>([]);

  useEffect(() => {
    // Do not open WS when on a reloader page — socket events can cause layout changes that unmount reloaders
    if (isReloaderRoute()) {
      console.warn("useMetricsSocket: skipping WebSocket connection on reloader route");
      return;
    }

    const backendWsBase = process.env.NEXT_PUBLIC_API_BASE_WS || "localhost:8000";
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socketUrl = url || `${protocol}://${backendWsBase}/ws/metrics`;

    console.log("🌐 Connecting to WebSocket:", socketUrl);
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WS connected");
    ws.onclose = () => console.warn("⚠️ WS closed");
    ws.onerror = (e) => console.error("❌ WS error", e);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        switch (msg.type) {
          case "metrics":
            setMetrics(msg.data);
            break;

          case "forecast":
            setForecasts((prev) => ({
              ...prev,
              [msg.target]: msg.values,
            }));
            break;

          case "anomaly":
            setAnomalies((prev) => [msg, ...prev].slice(0, 200));
            break;

          case "audit":
            console.log("🧾 Received audit event:", msg.event);
            setAuditLogs((prev) => [
              {
                event: msg.event,
                created_at: new Date(msg.ts),
                meta: msg.meta,
              },
              ...prev,
            ].slice(0, 100));
            break;

          default:
            console.log("ℹ️ Unknown WS message:", msg);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [url]);

  return { metrics, forecasts, anomalies, auditLogs };
}
