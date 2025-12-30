"use client";

import { useState } from "react";
import NebulaRibbon from "./NebulaRibbon";
import NebulaConsole from "./NebulaConsole";
import PageFade from "./PageFade";

export default function NovaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const sidebarWidth = expanded ? 200 : 72;

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_top,_#3a2f2a,_#161618_45%,_#0b0d10_75%)]">
      <NebulaRibbon collapsedDefault={!expanded} onExpandChange={setExpanded} />

      <NebulaConsole />

      <main
        className="pt-16 pb-12 transition-[padding-left] duration-300 ease-out"
        style={{ paddingLeft: sidebarWidth + 24 }}
      >
        <div className="px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
