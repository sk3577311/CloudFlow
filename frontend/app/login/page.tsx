"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import api from "@/lib/axios";
import { saveToken } from "@/lib/auth";
import { Lock, User, Loader2 } from "lucide-react";

export default function TaskFlowLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // subtle animated gradient background
  useEffect(() => {
    const bg = document.getElementById("animated-bg");
    if (!bg) return;
    let deg = 45;
    const animate = () => {
      deg = (deg + 0.3) % 360;
      bg.style.background = `linear-gradient(${deg}deg, rgba(99,102,241,0.2), rgba(147,51,234,0.15), rgba(236,72,153,0.1))`;
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      saveToken(res.data.access_token);
      showToast(`Welcome back, ${username}!`);
      router.push("/dashboard");
    } catch {
      showToast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="animated-bg"
      className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-white dark:bg-neutral-950 overflow-hidden transition-colors"
    >
      {/* Floating Accent Dots */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400/40 dark:bg-indigo-300/20"
          initial={{ x: Math.random() * 1400, y: Math.random() * 900 }}
          animate={{
            y: [0, 10, -10, 0],
            opacity: [0.4, 0.8, 0.5, 0.4],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Left Content Section */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start text-center lg:text-left px-8 lg:px-20 z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl lg:text-6xl font-semibold text-gray-800 dark:text-gray-100 mb-3 tracking-tight"
        >
          Welcome to{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </motion.h1>
        <p className="text-gray-600 dark:text-gray-400 text-base lg:text-lg max-w-md">
          A cloud-native automation platform to manage, monitor, and scale your
          background jobs effortlessly.
        </p>
      </motion.div>

      {/* Right Login Card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-md lg:w-1/3 mt-10 lg:mt-0 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border border-gray-200/40 dark:border-neutral-700/40 rounded-2xl shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] p-8 mx-6"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md mb-3">
            <span className="text-white text-lg font-bold">TF</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            Sign in to TaskFlow
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Secure dashboard access
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-gray-900 dark:text-gray-100 backdrop-blur-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-gray-900 dark:text-gray-100 backdrop-blur-sm"
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

        <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Forgot your password?{" "}
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Reset
          </span>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-6 text-gray-400 dark:text-gray-500 text-xs tracking-wide"
      >
        © {new Date().getFullYear()} TaskFlow Cloud — Secure Access Portal
      </motion.p>
    </div>
  );
}
