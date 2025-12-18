"use client";

export default function FiltersBar({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: (f: string) => void;
}) {
  const filters = ["all", "queued", "processing", "completed", "failed"];

  return (
    <div className="flex gap-3 mb-6">
      {filters.map((f) => {
        const active = filter === f;

        return (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              group relative px-5 py-2 rounded-xl text-sm font-medium transition-all
              border overflow-hidden backdrop-blur-sm
              ${
                active
                  ? `
                    bg-[var(--tf-card)] 
                    border-[var(--tf-accent)] 
                    text-[var(--tf-accent)]
                    shadow-[0_0_12px_rgba(200,237,242,0.15)]
                    scale-[1.03]
                  `
                  : `
                    bg-[var(--tf-card)]
                    text-[var(--tf-text-dim)]
                    border-[var(--tf-border)]
                    hover:text-white hover:border-[var(--tf-accent)/40]
                    hover:shadow-[0_0_8px_rgba(200,237,242,0.15)]
                  `
              }
            `}
          >
            {/* Accent Dot (active) */}
            {active && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--tf-accent)] animate-pulse" />
            )}

            <span className={active ? "ml-4" : ""}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </span>

            {/* Underline animation (active or hover) */}
            <span
              className={`
                absolute bottom-0 left-0 h-[2px] bg-[var(--tf-accent)]
                transition-all duration-300
                ${
                  active
                    ? "w-full opacity-100"
                    : "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"
                }
              `}
            />
          </button>
        );
      })}
    </div>
  );
}
