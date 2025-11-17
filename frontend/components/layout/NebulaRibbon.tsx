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
import { useEffect, useState } from "react";

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
    <motion.aside
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="
        fixed z-40 top-8 bottom-8 left-5
        rounded-2xl border border-[var(--tf-border)]
        bg-[rgba(255,255,255,0.02)]
        shadow-[0_0_30px_rgba(0,0,0,0.25)]
        backdrop-blur-md
        transition-all duration-300 overflow-hidden
      "
      style={{ width: expanded ? 180 : 72 }}
      onMouseEnter={() => setExpandState(true)}
      onMouseLeave={() => setExpandState(false)}
    >
      <div className="flex flex-col h-full">

        {/* BRAND */}
        <div className="flex items-center gap-3 p-4">
          <div className="
            w-10 h-10 rounded-xl bg-white/10 
            flex items-center justify-center
          ">
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
                  group flex items-center gap-3
                  px-3 py-2.5 rounded-xl
                  transition-all duration-150 relative
                  ${active
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

                {/* Label when expanded */}
                {expanded && (
                  <div className="flex flex-col">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-[11px] text-[var(--tf-text-dim)]">
                      Open {item.name}
                    </span>
                  </div>
                )}

                {/* Tooltip when collapsed */}
                {!expanded && (
                  <span
                    className="
                      absolute left-16 opacity-0
                      group-hover:left-20 group-hover:opacity-100
                      transition-all duration-200
                      bg-black text-white text-xs
                      border border-white/10 px-2 py-1 rounded-md
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

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setExpandState(!expanded)}
          className="
            w-full flex items-center gap-2 px-3 py-2 mb-3
            rounded-lg hover:bg-white/5 transition
            text-white/60
          "
        >
          <ChevronLeft
            className={`w-5 h-5 transition ${expanded ? "" : "rotate-180"}`}
          />
        </button>
      </div>
    </motion.aside>
  );
}
