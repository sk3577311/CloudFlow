"use client";
import { RefreshCw, Bell, User, LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import AlertsBell from "./AlertsBell";

interface TopBarProps {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: string;
}

export default function TopBar({ title, onRefresh, loading, lastUpdate }: TopBarProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState("light");

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  useEffect(() => {
    if (!loading && lastUpdate) {
      toast.success(`✅ Updated successfully at ${lastUpdate}`, {
        duration: 2500,
        style: { background: "#f9fafb", border: "1px solid #d1d5db" },
      });
    }
  }, [loading, lastUpdate]);

  return (
    <header
      className={`flex justify-between items-center h-16 px-6 transition-all sticky top-0 z-40 ${
        loading
          ? "bg-indigo-50 dark:bg-neutral-800 animate-pulse"
          : "bg-white dark:bg-neutral-900 shadow-sm"
      }`}
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard / {title}</p>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition shadow-sm ${
            loading
              ? "bg-indigo-50 border-indigo-200 text-indigo-500 cursor-not-allowed"
              : "bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:shadow-md"
          }`}
        >
          <RefreshCw
            className={`w-5 h-5 transition ${
              loading ? "animate-spin text-indigo-500" : "text-gray-700 dark:text-gray-300"
            }`}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {loading ? "Refreshing..." : `Updated ${lastUpdate}`}
          </span>
        </button>

        {/* Notifications */}
        <AlertsBell />

        {/* User */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 px-3 py-2 rounded-lg transition relative"
          onClick={() => setShowMenu((prev) => !prev)}
        >
          <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">Admin</span>

          {showMenu && (
            <div className="absolute right-0 top-12 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-md w-40 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
