"use client"

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Phone, Loader2, Zap } from "lucide-react";
import api from "@/lib/axios";
import { saveToken } from "@/lib/auth";
import { showToast } from "@/components/Toast";

// SplitLoginAdvanced.tsx
// - Upgraded split login with TaskFlow-like motion system
// - Animated tab indicator, fluid input labels, success transition into a reloader
// - Background pulse that matches dashboard accent
// - Small job-status prefetch mock to show continuity with dashboard

export default function SplitLoginAdvanced() {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [prefetching, setPrefetching] = useState(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  // Motion variants
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
    exit: { opacity: 0, y: -8 },
  };

  const inputVariant = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } };

  async function fetchInitialData() {
    // small mock to mimic fetching dashboard state before redirect
    setPrefetching(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      // you could prefetch /api/jobs here
    } finally {
      setPrefetching(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "email") {
        const res = await api.post("/auth/login", { username: identifier, password });
        const token = res?.data?.access_token || res?.data?.token;
        if (!token) throw new Error("No token");
        saveToken(token);

        // micro-success animation -> prefetch -> route to TaskFlow reloader
        setSuccess(true);
        await fetchInitialData();
        // graceful handoff to reloader which will continue with dashboard setup
        router.replace("/reloading?mode=login");
      } else {
        await api.post("/auth/otp/send", { phone: identifier });
        showToast("OTP sent to your phone", "success");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Tab button with animated indicator
  const TabButton: React.FC<{ t: "email" | "phone" }> = ({ t, children }) => (
    <button
      onClick={() => setMode(t)}
      className={`relative px-3 py-1 rounded-md text-sm font-medium ${mode === t ? "text-black" : "text-white/70"}`}
      aria-pressed={mode === t}
    >
      {children}
      {mode === t && (
        <motion.div
          layoutId="tab-indicator"
          ref={indicatorRef}
          className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-400/90 z-[-1]"
          style={{ transform: "translateZ(0)", margin: 1 }}
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex items-stretch bg-gradient-to-br from-indigo-950 to-slate-900 overflow-hidden">
      {/* Left: marketing with subtle animated stats to feel like TaskFlow */}
      <aside className="hidden md:flex w-1/2 items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <motion.h1 initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="text-4xl font-bold mb-4">Welcome to TaskFlow</motion.h1>
          <motion.p initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.12 }} className="text-lg text-white/80 mb-6">Run, monitor and automate background work with confidence. Secure by default, lightweight by design.</motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-white/6 rounded-xl p-6 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-white/60">Active jobs</div>
                <div className="text-xl font-semibold">14</div>
              </div>
              <div>
                <div className="text-xs text-white/60">Alerts</div>
                <div className="text-xl font-semibold">2</div>
              </div>
            </div>

            <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1.2 }} className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
            </div>
          </motion.div>

          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mt-6 space-y-3 text-sm text-white/70">
            <li>• Lightweight agent integration</li>
            <li>• Observability and secure access</li>
            <li>• Role-based controls & audit logs</li>
          </motion.ul>
        </div>
      </aside>

      {/* Right: Login form */}
      <main className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence>
          {!success ? (
            <motion.div initial="hidden" animate="visible" exit="exit" variants={cardVariants} className="w-full max-w-md bg-white/6 border border-white/8 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Sign in</h2>
                  <p className="text-sm text-white/70">Secure access to your workspace</p>
                </div>

                <div className="flex items-center gap-2 text-xs relative z-10">
                  <TabButton t="email">Email</TabButton>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.label variants={inputVariant} className="block">
                  <span className="text-xs text-white/70">{mode === "email" ? "Email" : "Phone number"}</span>
                  <div className="mt-2 relative">
                    {mode === "email" ? (
                      <User className="absolute left-3 top-3 text-white/60" size={16} />
                    ) : (
                      <Phone className="absolute left-3 top-3 text-white/60" size={16} />
                    )}
                    <input
                      type="text"
                      inputMode={mode === "phone" ? "tel" : "email"}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={mode === "email" ? "you@company.com" : "+91 98765 43210"}
                      className="w-full pl-10 pr-3 py-2 rounded-md bg-transparent border border-white/10 text-white placeholder-white/60 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </div>
                </motion.label>

                {mode === "email" && (
                  <motion.label variants={inputVariant} className="block">
                    <span className="text-xs text-white/70">Password</span>
                    <div className="mt-2 relative">
                      <Lock className="absolute left-3 top-3 text-white/60" size={16} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 rounded-md bg-transparent border border-white/10 text-white placeholder-white/60 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                  </motion.label>
                )}

                <motion.div variants={inputVariant} className="flex items-center justify-between text-xs text-white/70">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" /> Remember
                  </label>
                  <button type="button" className="underline" onClick={() => showToast("Reset flow (demo)", "info")}>Forgot?</button>
                </motion.div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-2 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-400 font-semibold text-black flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : mode === "email" ? "Sign in" : "Send OTP"}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            // success state animation before redirect (keeps visual continuity with TaskFlow dashboard)
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md bg-white/6 border border-white/8 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black">
                <Zap />
              </div>
              <div className="text-lg font-semibold text-white">Welcome back</div>
              <div className="text-sm text-white/70">Preparing your workspace...</div>
              <div className="w-full mt-2">
                <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: prefetching ? "60%" : "100%" }} transition={{ duration: 0.9 }} className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
