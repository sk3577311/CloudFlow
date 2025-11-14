"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";
import api from "@/lib/axios";
import { saveToken, getToken } from "@/lib/auth";
import { showToast } from "@/components/Toast";

export default function TaskFlowLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data.access_token || res.data.token;

      saveToken(token);

      // Now immediately go to reloader
      router.replace("/reloading?mode=login");

    } catch (err) {
      showToast("Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--tf-accent)]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm tf-card rounded-2xl p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--tf-accent)] text-black font-bold shadow-md mb-3">
            TF
          </div>
          <h1 className="text-2xl font-semibold">Sign in to TaskFlow</h1>
          <p className="text-[var(--tf-text-dim)] text-sm mt-1">
            Manage and monitor your jobs
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-[var(--tf-text-dim)]" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] text-white placeholder-[var(--tf-text-dim)] focus:ring-2 focus:ring-[var(--tf-accent)] outline-none"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-[var(--tf-text-dim)]" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-[var(--tf-card)] border border-[var(--tf-border)] text-white placeholder-[var(--tf-text-dim)] focus:ring-2 focus:ring-[var(--tf-accent)] outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--tf-accent)] !text-black font-semibold shadow-md hover:opacity-90 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center text-black">
                <Loader2 className="animate-spin mr-2" size={18} /> Logging in...
              </span>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
