"use client";
import { Repeat, X } from "lucide-react";

export default function JobModal({ job, onClose, retrying }: { job:any; onClose: ()=>void; retrying:boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="tf-card rounded-[22px] w-11/12 max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-[#1E1F22] hover:bg-[#2a2c2f] transition">
          <X className="w-5 h-5 text-white/80" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-white">Job Details</h2>

        <div className="flex flex-col gap-2 mb-4 text-[var(--tf-text-dim)]">
          <p><span className="font-semibold text-white">ID:</span> {job.id}</p>
          <p><span className="font-semibold text-white">Task:</span> {job.task}</p>
          <p><span className="font-semibold text-white">Status:</span> {job.status}</p>
          <p><span className="font-semibold text-white">Created At:</span> {new Date(job.created_at || "").toLocaleString()}</p>
          <p><span className="font-semibold text-white">Updated At:</span> {job.updated_at ? new Date(job.updated_at).toLocaleString() : "-"}</p>
        </div>

        {job.history && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-white">Status Timeline</h3>
            <ul className="flex flex-col gap-1">
              {job.history.map((h:any, idx:number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${h.status === "queued" ? "bg-[#EBD38B]" : h.status === "processing" ? "bg-[#C8EDF2]" : h.status === "completed" ? "bg-[#A4EAC0]" : h.status === "failed" ? "bg-[#FFB3B3]" : "bg-[#777]"}`} />
                  <span className="text-white capitalize">{h.status}</span>
                  <span className="text-[var(--tf-text-dim)] text-sm">{new Date(h.time).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.status === "failed" && (
          <button disabled={retrying} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#3A2020] text-[#FFB3B3] hover:bg-[#4a2828] transition ${retrying ? "opacity-50 cursor-not-allowed" : ""}`}>
            <Repeat className="w-5 h-5" />
            {retrying ? "Retrying..." : "Retry Job"}
          </button>
        )}
      </div>
    </div>
  );
}
