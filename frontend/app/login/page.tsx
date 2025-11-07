"use client";

import { useState } from "react";
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
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 overflow-hidden">
      {/* Floating colorful blobs */}
      <motion.div
        className="absolute w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px] top-[-150px] left-[-150px]"
        animate={{
          x: [0, 50, -30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-pink-400/20 rounded-full blur-[100px] bottom-[-100px] right-[-100px]"
        animate={{
          x: [0, -30, 30, 0],
          y: [0, -20, 20, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl rounded-2xl border border-gray-100 dark:border-neutral-800 p-10 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md mb-3">
            <span className="text-white text-xl font-bold">T</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            TaskFlow Cloud
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage. Automate. Scale.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={18} />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Don’t have an account?{" "}
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Sign up
          </span>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-gray-400 dark:text-gray-500 text-xs tracking-wide"
      >
        © {new Date().getFullYear()} TaskFlow Cloud
      </motion.p>
    </div>
  );
}
