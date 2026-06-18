"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import toast from "react-hot-toast";

export default function MarkPaidButton({ billId }: { billId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = async () => {
    if (!confirm("Mark this bill as paid?")) return;
    const res = await fetch(`/api/admin/bills/${billId}/mark-paid`, { method: "POST" });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success("Marked as paid");
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      disabled={isPending}
      className="btn btn-primary btn-sm"
      title="Mark as paid"
    >
      <Check className="w-3.5 h-3.5" /> Mark paid
    </button>
  );
}
