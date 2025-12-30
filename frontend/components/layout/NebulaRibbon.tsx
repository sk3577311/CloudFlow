"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Layers,
  Activity,
  Cpu,
  Users,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { name: "Overview", href: "/dashboard/", icon: Home },
  { name: "Jobs", href: "/dashboard/jobs", icon: Layers },
  { name: "Tasks", href: "/dashboard/tasks", icon: Activity },
  { name: "Workers", href: "/dashboard/workers", icon: Cpu },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function NebulaRibbon({
  collapsedDefault = true,
  onExpandChange,
}: {
  collapsedDefault?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(!collapsedDefault);

  function setExpandState(v: boolean) {
    setExpanded(v);
    onExpandChange?.(v);
  }

  return (
    <aside
      className="
        fixed z-40 top-0 bottom-0 left-0 bg-[#0b0d10] border-r border-white/5 transition-[width]
      "
      style={{ width: expanded ? 200 : 72 }}
    >
      <div className="flex flex-col h-full">
        {/* BRAND */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="font-semibold text-white">TF</span>
          </div>

          {expanded && (
            <div>
              <div className="text-white font-medium">TaskFlow</div>
              <div className="text-xs text-[var(--tf-text-dim)]">
                Orchestration
              </div>
            </div>
          )}
        </div>

        {/* NAV */}
        <div className="flex-1 flex flex-col gap-2 p-2 mt-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center
                  px-3 py-2.5 rounded-xl
                  transition-all duration-150 relative
                  ${expanded ? "gap-3 justify-start" : "justify-center"}
                  ${
                    active
                      ? "bg-white/10 border border-white/10 text-white"
                      : "hover:bg-white/5 text-white/70"
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 transition ${
                    active
                      ? "text-white"
                      : "text-white/70 group-hover:text-white"
                  }`}
                />

                {/* Label (expanded only) */}
                {expanded && (
                  <div className="flex flex-col">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-[11px] text-[var(--tf-text-dim)]">
                      Open {item.name}
                    </span>
                  </div>
                )}

                {/* Tooltip (collapsed only) */}
                {!expanded && (
                  <span
                    className="
                      absolute left-16 opacity-0
                      group-hover:left-20 group-hover:opacity-100
                      transition-all duration-200
                      bg-black text-white text-xs
                      border border-white/10
                      px-2 py-1 rounded-md
                      whitespace-nowrap
                      pointer-events-none
                    "
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* PROFILE */}
        <div className="px-2 mb-2">
          <button
            className={`
              w-full flex items-center
              ${expanded ? "gap-3 px-3" : "justify-center"}
              py-2 rounded-xl
              bg-white/5 hover:bg-white/10
              transition
            `}
          >
            {/* Avatar */}
            <div
              className="
              w-8 h-8 rounded-full
              bg-white/20
              flex items-center justify-center
              text-sm font-semibold text-white
            "
            >
              A
            </div>

            {/* Info (expanded only) */}
            {expanded && (
              <div className="flex flex-col items-start text-left">
                <span className="text-sm text-white">Admin</span>
                <span className="text-[11px] text-[var(--tf-text-dim)]">
                  admin@taskflow
                </span>
              </div>
            )}
          </button>
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setExpandState(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-lg hover:bg-white/5 transition text-white/60"
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${
              expanded ? "" : "rotate-180"
            }`}
          />
          {expanded && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
