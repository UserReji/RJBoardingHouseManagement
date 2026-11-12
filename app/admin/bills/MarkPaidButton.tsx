"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import toast from "react-hot-toast";

export default function MarkPaidButton({ billId }: { billId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticPaid, setOptimisticPaid] = useState(false);

  const onClick = async () => {
    if (!confirm("Mark this bill as paid?")) return;
    setIsSaving(true);
    setOptimisticPaid(true);
    try {
      const res = await fetch(`/api/admin/bills/${billId}/mark-paid`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Marked as paid");
      startTransition(() => router.refresh());
    } catch {
      setOptimisticPaid(false);
      toast.error("Could not update this bill. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      disabled={isPending || isSaving || optimisticPaid}
      className="btn btn-primary btn-sm"
      title="Mark as paid"
    >
      <Check className="w-3.5 h-3.5" /> {isSaving ? "Saving…" : optimisticPaid ? "Paid" : "Mark paid"}
    </button>
  );
}
