"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

interface Props {
  title: string;
  liveData: { ts: number; value: number }[];
  forecastData: { ts: number; value: number }[];
  color: string;
}

export default function SmartForecastChart({ title, liveData, forecastData, color }: Props) {
  const mergedData = [...(liveData || []), ...(forecastData || [])];
  const hasData = mergedData.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="tf-card rounded-[22px] p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <div className="h-56">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="ts" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="var(--tf-text-dim)" />
              <YAxis stroke="var(--tf-text-dim)" />
              <Tooltip contentStyle={{ background: "var(--tf-card)", border: "1px solid var(--tf-border)", borderRadius: "12px", color: "white" }} />
              <Line type="monotone" dataKey="value" data={liveData} stroke={color} strokeWidth={2.5} dot={false} name="Actual" />
              <Line type="monotone" dataKey="value" data={forecastData} stroke={color} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--tf-text-dim)] text-sm">No forecast data yet ⏳</div>
        )}
      </div>
    </motion.div>
  );
}
