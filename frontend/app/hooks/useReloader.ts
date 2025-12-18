"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = {
  id: string;
  label?: string;
  duration?: number;
};

export type UseReloaderOptions = {
  steps?: Step[];
  redirectTo?: string;
  onValidate?: () => Promise<boolean> | boolean;
  onFinalize?: () => void | Promise<void>;
  lifecycleTimeoutMs?: number;
};

export function useReloader(opts: UseReloaderOptions = {}) {
  const {
    steps = [],
    redirectTo = "/",
    onValidate,
    onFinalize,
    lifecycleTimeoutMs = 20000,
  } = opts;

  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(true);
  const [percent, setPercent] = useState(0);

  const timersRef = useRef<number[]>([]);
  const lifecycleTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const redirectDoneRef = useRef(false);

  function ensureSingleMount(key = "__tf_reloader_mount") {
    if (typeof window === "undefined") return () => {};
    if ((window as any)[key]) return () => {};
    (window as any)[key] = true;
    return () => {
      (window as any)[key] = false;
    };
  }

  // percent UI calculation
  useEffect(() => {
    const total = Math.max(1, steps.length);
    setPercent(Math.round(((stepIndex + 1) / total) * 100));
    setBusy(stepIndex < total - 1);
  }, [stepIndex, steps.length]);

  function cleanupAll() {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    if (lifecycleTimerRef.current) clearTimeout(lifecycleTimerRef.current);
    lifecycleTimerRef.current = null;
  }

  // run steps sequentially and WAIT for them
  function runSteps(): Promise<void> {
    return new Promise((resolve) => {
      let elapsed = 0;

      steps.forEach((s, i) => {
        const dur = s.duration ?? 800;
        const t = window.setTimeout(() => {
          setStepIndex(i);
          if (i === steps.length - 1) {
            resolve();
          }
        }, elapsed);
        timersRef.current.push(t);
        elapsed += dur;
      });
    });
  }

  async function runLifecycle() {
    if (startedRef.current) return;
    startedRef.current = true;

    // global timeout safeguard
    lifecycleTimerRef.current = window.setTimeout(() => {
      console.warn("Lifecycle timed out.");
      setStepIndex(steps.length - 1);
    }, lifecycleTimeoutMs);

    try {
      // 1. validate
      if (onValidate) {
        const ok = await Promise.resolve(onValidate());
        if (!ok) throw new Error("Validation failed");
      }

      // 2. run visual steps (WAIT)
      await runSteps();

      // 3. finalize AFTER steps hit 100%
      if (onFinalize) {
        await Promise.resolve(onFinalize());
      }
    } finally {
      setStepIndex(steps.length - 1);
      setBusy(false);

      if (lifecycleTimerRef.current) {
        clearTimeout(lifecycleTimerRef.current);
        lifecycleTimerRef.current = null;
      }
    }
  }

  function safeRedirect(href: string) {
    if (redirectDoneRef.current) return;
    redirectDoneRef.current = true;
    router.replace(href);
  }

  useEffect(() => cleanupAll, []);

  return {
    stepIndex,
    busy,
    percent,
    runLifecycle,
    safeRedirect,
    ensureSingleMount,
  };
}

export default useReloader;
