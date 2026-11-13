"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";
import toast from "react-hot-toast";

export default function CashPaymentButton({ billId, amountDue }: { billId: string; amountDue: number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const submitCashPayment = async () => {
    if (!window.confirm(`Confirm that you have read this bill and paid ₱${amountDue.toLocaleString()} in cash? The bill will remain pending until an admin confirms receipt.`)) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tenant/bills/${billId}/payment`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "cash" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not submit cash payment");
      toast.success("Cash payment submitted. Waiting for admin confirmation.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit cash payment");
    } finally { setSubmitting(false); }
  };

  return <button type="button" onClick={submitCashPayment} disabled={submitting} className="card w-full min-h-16 p-4 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center justify-between text-left disabled:opacity-60">
    <div><p className="font-medium text-slate-900">{submitting ? "Submitting…" : "I’ve paid in cash"}</p><p className="text-sm text-slate-600">Tell the admin this bill is read and paid in cash; they’ll confirm it.</p></div>
    <Banknote className="w-5 h-5 text-emerald-700 flex-shrink-0" />
  </button>;
}
