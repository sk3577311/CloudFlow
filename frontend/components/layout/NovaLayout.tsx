"use client";

import { useEffect, useState } from "react";
import NebulaRibbon from "./NebulaRibbon";
import NebulaConsole from "./NebulaConsole";
import PageFade from "./PageFade";

export default function NovaLayout({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const width = expanded
      ? "var(--tf-ribbon-width-expanded)"
      : "var(--tf-ribbon-width)";
    document.documentElement.style.setProperty("--tf-ribbon-offset", width);
  }, [expanded]);

  return (
    <div className="min-h-screen bg-[var(--tf-bg)] text-white">
      
      <NebulaRibbon collapsedDefault={!expanded} onExpandChange={setExpanded} />

      <NebulaConsole />

      <main
        className="pt-16 pr-2 pb-12 transition-all duration-300"
        style={{ marginLeft: "var(--tf-ribbon-offset)" }}
      >
        <PageFade>{children}</PageFade>
      </main>

    </div>
  );
}
