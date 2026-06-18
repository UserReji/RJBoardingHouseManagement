"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ReplyForm({ concernId }: { concernId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 5) { toast.error("Reply must be at least 5 characters"); return; }
    setSending(true);
    const res = await fetch(`/api/tenant/concerns/${concernId}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    setSending(false);
    if (!res.ok) { toast.error("Failed to send reply"); return; }
    setBody("");
    toast.success("Reply sent");
    startTransition(() => router.refresh());
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Add a reply</p>
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={4}
        placeholder="Add more details, ask a question…"
        className="input resize-none"
      />
      <button type="submit" disabled={sending || isPending} className="btn btn-primary">
        <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
