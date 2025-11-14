"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import React from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  color?: string;
  sparkData?: { time?: string; value: number }[];
  icon?: React.ReactNode;

  // ADD THESE (fixes your TS compile error)
  highlight?: boolean;
  trend?: "up" | "down" | "steady";
}

export default function MetricCard({
  label,
  value,
  color = "#A7EFFF",
  sparkData = [],
  icon,
  highlight = false,
  trend = "steady",
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-2xl tf-card p-5 shadow-lg transition ${
        highlight ? "ring-2 ring-[var(--tf-accent)]" : ""
      }`}
    >
      {/* accent dot */}
      <div
        className="absolute top-4 right-4 w-2 h-2 rounded-full"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-[var(--tf-text-dim)] flex items-center gap-2">
            {label}

            {/* Trend indicator (optional UI) */}
            {trend === "up" && (
              <span className="text-green-400 text-xs font-semibold">↑</span>
            )}
            {trend === "down" && (
              <span className="text-red-400 text-xs font-semibold">↓</span>
            )}
          </div>

          <div className="text-3xl font-semibold" style={{ color }}>
            {value}
          </div>
        </div>

        {icon && <div className="text-[var(--tf-text-dim)]">{icon}</div>}
      </div>

      {sparkData && sparkData.length > 0 && (
        <div className="mt-3 h-8 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                dataKey="value"
                type="monotone"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
