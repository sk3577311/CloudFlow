"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";
import { showToast } from "@/components/Toast";
import api from "@/lib/axios";
import { saveToken } from "@/lib/auth";

export default function TaskFlowLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("Please enter both username and password", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      saveToken(res.data.access_token);
      showToast(`Welcome back, ${username}!`);
      router.replace("/reloading");
    } catch {
      showToast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/40 dark:border-neutral-800/60 p-8"
      >
        {/* Logo / Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md mb-3">
            <span className="text-white font-semibold text-lg">TF</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Sign in to TaskFlow
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage and monitor your jobs seamlessly
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={18} /> Logging in...
              </span>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Forgot password?{" "}
            <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
              Reset
            </span>
          </p>
        </div>
      </motion.div>

      {/* Subtle floating background blobs */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10"
        animate={{ x: [0, 50, -50, 0], y: [0, 20, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl -z-10"
        animate={{ x: [0, -60, 60, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
