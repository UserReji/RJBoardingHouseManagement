"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function AdjustmentForm({ billId }: { billId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState(""); const [amount, setAmount] = useState(""); const [reason, setReason] = useState("");
  const [type, setType] = useState<"charge" | "credit">("charge"); const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch(`/api/admin/bills/${billId}/adjust`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, amount: Number(amount), reason, type }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save adjustment");
      setLabel(""); setAmount(""); setReason(""); toast.success("Bill adjustment recorded"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save adjustment"); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="card p-4 space-y-3">
    <div><h3 className="font-bold text-slate-900">Add a bill adjustment</h3><p className="text-xs text-slate-500">Adjustments are appended to the history with a reason.</p></div>
    <div className="grid sm:grid-cols-3 gap-3">
      <label><span className="label">Key / description</span><input value={label} onChange={(e) => setLabel(e.target.value)} className="input" placeholder="Advance rent, late fee…" required /></label>
      <label><span className="label">Adjustment</span><select value={type} onChange={(e) => setType(e.target.value as "charge" | "credit")} className="select"><option value="charge">Add charge</option><option value="credit">Apply credit</option></select></label>
      <label><span className="label">Amount (₱)</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" required /></label>
    </div>
    <label className="block"><span className="label">Reason (saved in the history)</span><input value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Explain this correction or advance payment" maxLength={500} required /></label>
    <button disabled={saving} className="btn btn-secondary btn-sm"><Plus className="w-4 h-4"/>{saving ? "Saving…" : "Save adjustment"}</button>
  </form>;
}
