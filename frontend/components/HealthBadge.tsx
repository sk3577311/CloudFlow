"use client";
import { useEffect, useState } from "react";

export default function HealthBadge() {
  const [status, setStatus] = useState("checking");

  async function checkHealth() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/system/health`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const backendOk = data.status.backend === "ok";
      const pgOk = data.status.postgres?.status === "ok";
      const redisOk = data.status.redis?.status === "ok";

      if (backendOk && pgOk && redisOk) setStatus("ok");
      else if (backendOk || pgOk || redisOk) setStatus("degraded");
      else setStatus("down");
    } catch {
      setStatus("down");
    }
  }

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const styles: Record<string,string> = {
    ok: "bg-[#1A2D21] text-[#A4EAC0]",
    degraded: "bg-[#2E2B17] text-[#EBD38B]",
    down: "bg-[#3A2020] text-[#FFB3B3]",
    checking: "bg-[#1E1F22] text-[var(--tf-text-dim)]",
  };

  const labels: Record<string,string> = {
    ok: "Healthy",
    degraded: "Degraded",
    down: "Down",
    checking: "Checking...",
  };

  return (
    <span className={`px-3 py-1 text-xs rounded-full border border-[var(--tf-border)] ${styles[status]}`} title={`Backend health: ${status}`}>
      {labels[status]}
    </span>
  );
}
