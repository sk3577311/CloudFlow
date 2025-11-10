export async function fetchJobsStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/`, {
    headers: { "x-api-key": "supersecret123" },
  });
  const jobs = await res.json();
  const stats = {
    total: jobs.length,
    queued: jobs.filter((j:any)=>j.status==="queued").length,
    completed: jobs.filter((j:any)=>j.status==="completed").length,
    failed: jobs.filter((j:any)=>j.status==="failed").length,
  };
  return stats;
}
