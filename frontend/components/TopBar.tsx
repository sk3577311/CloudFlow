"use client";

import { RefreshCw, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import AlertsBell from "./AlertsBell";
import HealthBadge from "./HealthBadge";

interface TopBarProps {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  lastUpdate: string;
}

export default function TopBar({ title, onRefresh, loading, lastUpdate }: TopBarProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const logoutGuardRef = useRef(false);

  const handleLogout = useCallback(() => {
    if (logoutGuardRef.current) return;
    logoutGuardRef.current = true;

    setShowMenu(false);

    // 🚨 IMPORTANT: Only navigate. Do NOT clear token from here.
    router.push("/reloading?mode=logout");
  }, [router]);

  return (
    <header
      className="
        tf-card rounded-[22px] px-6 py-4 sticky top-4 z-40 mx-6 
        flex justify-between items-center backdrop-blur-lg
        bg-[var(--tf-card)]/90 border border-[var(--tf-border)]
      "
    >
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          {title} <HealthBadge />
        </h1>
        <p className="text-sm text-[var(--tf-text-dim)]">Dashboard / {title}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="
            px-4 py-2 rounded-xl bg-[#1E1F22] border border-[var(--tf-border)]
            hover:bg-[#2a2c2f] transition flex items-center gap-2
            disabled:opacity-50
          "
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-[#00E3E3]" : "text-white"}`} />
          <span className="text-sm text-white/80">
            {loading ? "Refreshing..." : `Updated ${lastUpdate}`}
          </span>
        </button>

        <AlertsBell />

        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E1F22] hover:bg-[#2a2c2f] transition"
          >
            <User className="w-5 h-5 text-white/80" />
            <span className="text-white/90 font-medium hidden sm:block">Admin</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 tf-card rounded-[18px] p-3 w-36 border border-[var(--tf-border)]">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#2a2c2f] transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
