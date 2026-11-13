"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";
import toast from "react-hot-toast";

export default function RecordCashPaymentForm({ billId, remaining }: { billId: string; remaining: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(remaining ? String(remaining) : "");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bill_id: billId, amount }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not record payment");
      toast.success("Cash payment recorded"); startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };
  if (remaining <= 0) return null;
  return <form onSubmit={submit} className="card p-4 flex flex-wrap items-end gap-3">
    <label className="flex-1 min-w-[180px]"><span className="label">Record cash received (₱)</span><input className="input tabular-nums" type="number" min="0.01" max={remaining} step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
    <button disabled={saving} className="btn btn-primary"><Banknote className="w-4 h-4" />{saving ? "Recording…" : "Record payment"}</button>
  </form>;
}
