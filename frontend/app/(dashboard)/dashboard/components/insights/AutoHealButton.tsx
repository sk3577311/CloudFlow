"use client";
import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { showToast } from "@/components/Toast";

export default function AutoHealButton({ onHealed }: { onHealed?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function triggerHeal() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auto-heal`, {
        method: "POST",
        headers: { "x-api-key": "supersecret123" },
      });
      if (res.ok) {
        showToast("🩺 Auto-heal triggered successfully");
        onHealed?.();
      } else showToast("Failed to trigger auto-heal", "error");
    } catch (err) {
      console.error(err);
      showToast("Auto-heal failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button disabled={loading} onClick={triggerHeal} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#1E1F22] border border-[var(--tf-border)] hover:bg-[#2a2c2f] transition text-white disabled:opacity-50">
      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <RotateCcw className="w-4 h-4" />} Auto-Heal
    </button>
  );
}
