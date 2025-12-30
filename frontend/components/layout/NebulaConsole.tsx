"use client";

import { useState, useRef, useCallback } from "react";
import { RefreshCw, User, LogOut, Zap } from "lucide-react";
import AlertsBell from "../AlertsBell";
import HealthBadge from "../HealthBadge";
import { useRouter } from "next/navigation";

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
      className="sticky top-4 z-50 pointer-events-none"
      style={{
        marginLeft: "calc(var(--tf-ribbon-width) + 24px)",
        marginRight: "24px",
      }}
    >
      <div className="mx-auto max-w-[1440px] pointer-events-auto">
        <div
          className="
            relative flex items-center justify-between
            px-6 py-3
            bg-[#0b0d10]
            border border-white/5
            rounded-xl
            text-sm
          "
        >
          {/* ACTIVITY MARKER (signature detail) */}
          <div
            className={`
              absolute left-0 top-0 bottom-0 w-[2px]
              transition-colors duration-300
              ${loading ? "bg-emerald-400" : "bg-white/10"}
            `}
          />

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-md bg-[#111] flex items-center justify-center font-semibold">
              TF
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-medium">
                {title}
                <HealthBadge />
              </div>
              <span className="text-xs text-white/40">
                Updated {lastUpdate ?? "--"}
              </span>
            </div>
          </div>

          {/* SEARCH */}
          <div className="flex-1 px-10 hidden md:block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs, tasks, workers…"
              className="
                w-full bg-transparent
                border border-white/5
                rounded-md px-3 py-1.5
                text-sm text-white
                placeholder:text-white/30
                focus:outline-none
                focus:border-white/15
              "
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefresh?.()}
              disabled={loading}
              className="
                p-2 rounded-md
                border border-white/5
                hover:bg-white/5 transition
              "
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? "animate-spin text-white" : "text-white/70"
                }`}
              />
            </button>

            <button
              className="
                p-2 rounded-md
                border border-white/5
                hover:bg-white/5 transition
              "
            >
              <Zap className="w-4 h-4 text-white/70" />
            </button>

            <AlertsBell />

            {/* USER */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="
                  flex items-center gap-2
                  px-3 py-2 rounded-md
                  border border-white/5
                  hover:bg-white/5 transition
                "
              >
                <User className="w-4 h-4 text-white/70" />
                <span className="hidden sm:block text-sm">Admin</span>
              </button>

              {menuOpen && (
                <div
                  className="
                    absolute right-0 mt-2 w-44
                    bg-[#0b0d10]
                    border border-white/5
                    rounded-md
                    shadow-lg
                  "
                >
                  <button
                    onClick={handleLogout}
                    className="
                      w-full flex items-center gap-2
                      px-3 py-2 text-sm
                      text-red-400
                      hover:bg-white/5 transition
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
