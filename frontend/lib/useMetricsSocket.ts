// lib/useMetricsSocket.ts
import { useEffect, useRef } from "react";

type OnMessage = (payload: any) => void;

export default function useMetricsSocket(onMessage: OnMessage) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/^http/, "ws");
    const url = `${base.replace(/\/$/, "")}/ws/metrics`;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // console.log("WS connected");
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          onMessage(data);
        } catch {}
      };

      ws.onclose = () => {
        // Soft reconnect without reloading browser
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 1500);
      };

      ws.onerror = () => {
        // Optional: log error
      };
    }

    connect();

    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [onMessage]);
}
