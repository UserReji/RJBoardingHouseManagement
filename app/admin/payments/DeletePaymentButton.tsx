"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const remove = async () => {
    if (!confirm("Delete this pending payment submission? Rejected and verified payment history is retained.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not delete payment");
      toast.success("Payment removed"); startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };
  return <button onClick={remove} disabled={saving} className="btn btn-ghost btn-sm text-red-600"><Trash2 className="w-4 h-4" />{saving ? "Removing…" : "Remove"}</button>;
}
