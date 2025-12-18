"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import useReloader from "@/app/hooks/useReloader";
import { clearToken } from "@/lib/auth";
import api from "@/lib/axios";

export default function UnifiedReloader() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") || "login";

  const isLogin = mode === "login";
  const isLogout = mode === "logout";

  const redirectTo = isLogin ? "/dashboard" : "/login";

  const steps = isLogin
    ? [
        { id: "sync", label: "Syncing jobs...", duration: 900 },
        { id: "fetch", label: "Fetching metrics...", duration: 900 },
        { id: "ready", label: "Preparing dashboard...", duration: 900 }
      ]
    : [
        { id: "clearing", label: "Signing out...", duration: 900 },
        { id: "cleanup", label: "Clearing session...", duration: 900 },
        { id: "done", label: "Done", duration: 900 }
      ];

  const startOnce = useRef(false);

  const { stepIndex, percent, runLifecycle, safeRedirect } = useReloader({
    steps,
    redirectTo,
    clearOnFinalize: false,

    onValidate: () => true,

    onFinalize: async () => {
      if (isLogout) {
        await api.post("/auth/logout").catch(() => {});
        clearToken(); // ONLY HERE
      }
    }
  });

  // run lifecycle ONCE
  useEffect(() => {
    if (startOnce.current) return;
    startOnce.current = true;

    runLifecycle().then(() => {
      // slight delay for smooth animation
      setTimeout(() => safeRedirect(redirectTo), 300);
    });
  }, []);

  const step = steps[Math.min(stepIndex, steps.length - 1)];

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--tf-bg)] text-white p-6">
      <motion.div
        className="w-full max-w-md tf-card rounded-2xl p-6 backdrop-blur-sm border border-[var(--tf-border)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[var(--tf-card)] border border-[var(--tf-border)]">
            <Loader2 className="w-7 h-7 text-[var(--tf-accent)] animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--tf-accent)]">
              {isLogin ? "Initializing…" : "Signing out…"}
            </h3>
            <p className="text-sm text-[var(--tf-text-dim)]">
              {step?.label}
            </p>
          </div>
        </div>

        <div className="mt-2">
          <div className="w-full bg-[var(--tf-card)] border border-[var(--tf-border)] h-2 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-900 ease-out"
              style={{
                width: `${percent}%`,
                background: "linear-gradient(90deg, var(--tf-accent), #9fe9ee)"
              }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs text-[var(--tf-text-dim)]">
            <span>{step?.label}</span>
            <span>{percent}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
