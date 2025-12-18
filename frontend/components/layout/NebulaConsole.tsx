"use client";

import { useState, useRef, useCallback } from "react";
import { RefreshCw, User, LogOut, Zap } from "lucide-react";
import AlertsBell from "../AlertsBell";
import HealthBadge from "../HealthBadge";
import { useRouter } from "next/navigation";

/**
 * NebulaConsole (Vercel-Style)
 * -----------------------------------------
 * - Flat black
 * - Thin 1px border (#1a1a1a)
 * - No blur, no gradients, no glow
 * - Clean spacing like Vercel dashboard
 * - Sticky on scroll
 * - Works with dynamic ribbon width
 */

export default function NebulaConsole({
  onRefresh,
  loading,
  lastUpdate,
  title = "Dashboard",
}: {
  onRefresh?: () => void;
  loading?: boolean;
  lastUpdate?: string;
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const logoutGuard = useRef(false);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    if (logoutGuard.current) return;
    logoutGuard.current = true;

    setMenuOpen(false);
    router.push("/reloading?mode=logout");
  }, [router]);

  return (
    <div
      className="
        sticky top-6 z-50 pointer-events-none
      "
      style={{
        marginLeft: "calc(var(--tf-ribbon-width) + 20px)",
        marginRight: "28px",
      }}
    >
      <div className="max-w-6xl mx-auto pointer-events-auto">
        <div
          className="
            flex items-center justify-between
            rounded-full px-5 py-3
            bg-[#111]
            border border-[#1a1a1a]
            text-sm
          "
        >
          {/* LEFT SIDE */}
          <div className="flex items-center gap-4">
            {/* BRAND CUBE */}
            <div className="w-8 h-8 rounded-md bg-[#111] flex items-center justify-center font-semibold text-white">
              TF
            </div>

            {/* TITLE + STATUS */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-medium text-white">
                {title} <HealthBadge />
              </div>
              <span className="text-xs text-[#666]">
                Updated {lastUpdate ?? "--"}
              </span>
            </div>

            {/* STATUS PILL (like Vercel "Healthy") */}
            <div className="hidden md:block text-xs text-[#888] px-2.5 py-1 rounded-md bg-[#111]">
              Connected
            </div>
          </div>

          {/* SEARCH (center) */}
          <div className="flex-1 px-8 hidden md:block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, jobs, workers…"
              className="
                w-full bg-[#0b0b0b] border border-[#1a1a1a]
                rounded-md px-3 py-1.5 outline-none text-sm
                text-white placeholder:text-[#555]
                focus:bg-[#0c0c0c] focus:border-[#333]
              "
            />
          </div>

          {/* RIGHT-ACTIONS */}
          <div className="flex items-center gap-2">
            {/* REFRESH */}
            <button
              onClick={() => onRefresh?.()}
              disabled={loading}
              className="
                p-2 rounded-md border border-[#1a1a1a]
                bg-[#0b0b0b] hover:bg-[#111]
                transition
              "
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-white" : "text-gray-200"
                  }`}
              />
            </button>

            {/* ACTION */}
            <button className="p-2 rounded-md border border-[#1a1a1a] bg-[#0b0b0b] hover:bg-[#111] transition">
              <Zap className="w-4 h-4 text-gray-300" />
            </button>

            {/* ALERTS */}
            <AlertsBell />

            {/* USER */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="
                  p-2 pl-3 pr-3 rounded-md border border-[#1a1a1a]
                  bg-[#0b0b0b] hover:bg-[#111] transition
                  flex items-center gap-2
                "
              >
                <User className="w-4 h-4 text-gray-300" />
                <span className="hidden sm:block text-sm text-gray-200">
                  Admin
                </span>
              </button>

              {/* DROPDOWN */}
              {menuOpen && (
                <div
                  className="
                    absolute right-0 mt-2 p-2 w-40
                    bg-[#0a0a0a] border border-[#1a1a1a]
                    rounded-md text-sm
                  "
                >
                  <button
                    onClick={handleLogout}
                    className="
                      w-full flex items-center gap-2 px-3 py-2
                      text-red-400 hover:bg-[#111] rounded-md transition
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
