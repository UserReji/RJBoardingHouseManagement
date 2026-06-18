"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, Wrench } from "lucide-react";
import toast from "react-hot-toast";

type Status = "open" | "in_progress" | "resolved";

export default function ConcernActions({
  concernId, currentStatus,
}: { concernId: string; currentStatus: Status }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 5) { toast.error("Reply must be at least 5 characters"); return; }
    setSending(true);
    const res = await fetch(`/api/admin/concerns/${concernId}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    setSending(false);
    if (!res.ok) { toast.error("Failed to send reply"); return; }
    setBody("");
    toast.success("Reply sent");
    startTransition(() => router.refresh());
  };

  const setStatus = async (status: Status) => {
    const res = await fetch(`/api/admin/concerns/${concernId}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast.error("Failed to update status"); return; }
    toast.success("Status updated");
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      {/* Status changer */}
      <div className="card p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Status</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatus("open")}
            disabled={isPending || currentStatus === "open"}
            className={`btn btn-sm ${currentStatus === "open" ? "btn-danger" : "btn-secondary"}`}
          >
            Open
          </button>
          <button
            onClick={() => setStatus("in_progress")}
            disabled={isPending || currentStatus === "in_progress"}
            className={`btn btn-sm ${currentStatus === "in_progress" ? "btn-primary" : "btn-secondary"}`}
          >
            <Wrench className="w-3.5 h-3.5" /> In Progress
          </button>
          <button
            onClick={() => setStatus("resolved")}
            disabled={isPending || currentStatus === "resolved"}
            className={`btn btn-sm ${currentStatus === "resolved" ? "btn-primary" : "btn-secondary"}`}
          >
            <Check className="w-3.5 h-3.5" /> Resolved
          </button>
        </div>
      </div>

      {/* Reply box */}
      <form onSubmit={sendReply} className="card p-4 space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Reply</p>
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)} rows={4}
          placeholder="Type your reply…"
          className="input resize-none"
        />
        <button type="submit" disabled={sending || isPending} className="btn btn-primary">
          <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send reply"}
        </button>
      </form>
    </div>
  );
}
