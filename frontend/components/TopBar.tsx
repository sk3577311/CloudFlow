"use client";

import { RefreshCw, Bell, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { toast } from "sonner"; // ✅ toast notification

interface TopBarProps {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: string;
}

export default function TopBar({ title, onRefresh, loading, lastUpdate }: TopBarProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  // ✅ Toast when refresh finishes
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
      className={`flex justify-between items-center h-16 px-6 transition-all ${
        loading
          ? "bg-indigo-50 shadow-inner animate-pulse"
          : "bg-white shadow"
      } sticky top-0 z-50`}
    >
      {/* Left: Page Title / Breadcrumb */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">Dashboard / {title}</p>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4 relative">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition shadow-sm ${
            loading
              ? "bg-indigo-50 border-indigo-200 text-indigo-500 cursor-not-allowed"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
        >
          <RefreshCw
            className={`w-5 h-5 transition ${
              loading ? "animate-spin text-indigo-500" : "text-gray-700"
            }`}
          />
          <span className="text-sm text-gray-700">
            {loading ? "Refreshing..." : `Updated ${lastUpdate}`}
          </span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar + Menu */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition relative"
          onClick={() => setShowMenu((prev) => !prev)}
        >
          <User className="w-6 h-6 text-gray-700" />
          <span className="text-gray-700 font-medium">Admin</span>

          {/* Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-md w-40 py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
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
