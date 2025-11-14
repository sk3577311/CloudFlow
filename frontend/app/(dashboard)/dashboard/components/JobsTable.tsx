"use client";
export default function JobsTable({ jobs, filter, onSelectJob }: { jobs: any[]; filter: string; onSelectJob: (job:any)=>void }) {
  const filteredJobs = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <div className="tf-card rounded-[22px] p-6 transition">
      <h2 className="text-lg font-semibold mb-4 text-white">Jobs Overview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-[var(--tf-border)] bg-[#1E1F22]">
              <th className="px-6 py-3 text-left text-[var(--tf-text-dim)]">ID</th>
              <th className="px-6 py-3 text-left text-[var(--tf-text-dim)]">Task</th>
              <th className="px-6 py-3 text-left text-[var(--tf-text-dim)]">Status</th>
              <th className="px-6 py-3 text-left text-[var(--tf-text-dim)]">Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((j) => (
              <tr key={j.id} className="border-b border-[var(--tf-border)] hover:bg-[#1A1C1F] transition cursor-pointer" onClick={() => onSelectJob(j)}>
                <td className="px-6 py-3 text-[var(--tf-accent)] font-medium">{String(j.id).slice(0,8)}</td>
                <td className="px-6 py-3 text-white">{j.task}</td>
                <td className="px-6 py-3 text-[var(--tf-text-dim)] capitalize">{j.status}</td>
                <td className="px-6 py-3 text-[var(--tf-text-dim)]">{new Date(j.created_at || "").toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
