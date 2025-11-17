"use client";

import { useEffect, useState } from "react";
import NebulaRibbon from "./NebulaRibbon";
import NebulaConsole from "./NebulaConsole";
import PageFade from "./PageFade";

export default function NovaLayout({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  // keep CSS var in sync in case other code toggles ribbon
  useEffect(()=> {
    const w = expanded ? 220 : 72;
    document.documentElement.style.setProperty("--tf-ribbon-width", `${w}px`);
  }, [expanded]);

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-[var(--tf-text)]">
      <NebulaRibbon collapsedDefault={true} onExpandChange={setExpanded} />
      <NebulaConsole />

      <main style={{ paddingLeft: `calc(var(--tf-ribbon-width) + 32px)`, paddingTop: 88 }} className="transition-all duration-200">
        <PageFade>{children}</PageFade>
      </main>
    </div>
  );
}
