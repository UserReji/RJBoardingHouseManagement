"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function WaterPaymentForm({ batchId, initialAmount, initialDate }: { batchId: string; initialAmount: number; initialDate: string | null }) {
  const router = useRouter(); const [amount, setAmount] = useState(String(initialAmount || 0)); const [paidAt, setPaidAt] = useState(initialDate || ""); const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch(`/api/admin/billing-batches/${batchId}/water-payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amount), paid_at: paidAt || null }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save the payment");
      toast.success("Water utility payment updated"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the payment"); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
    <label className="min-w-36 flex-1"><span className="label">Water utility paid (₱)</span><input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" /></label>
    <label className="min-w-36 flex-1"><span className="label">Payment date</span><input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="input" /></label>
    <button className="btn btn-secondary btn-sm" disabled={saving}>{saving ? "Saving…" : "Save payment"}</button>
  </form>;
}
