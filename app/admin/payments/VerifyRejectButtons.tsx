"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyRejectButtons({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<"verified" | "rejected" | null>(null);

  const set = async (status: "verified" | "rejected") => {
    setIsSaving(true);
    setOptimisticStatus(status);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(status === "verified" ? "Verified" : "Rejected");
      startTransition(() => router.refresh());
    } catch {
      setOptimisticStatus(null);
      toast.error("Could not update this payment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-2 pt-4 border-t border-slate-100">
      <button onClick={() => set("verified")} disabled={isPending || isSaving || optimisticStatus !== null} className="btn btn-primary btn-sm flex-1">
        <Check className="w-4 h-4" /> {optimisticStatus === "verified" ? (isSaving ? "Saving…" : "Verified") : "Verify"}
      </button>
      <button onClick={() => set("rejected")} disabled={isPending || isSaving || optimisticStatus !== null} className="btn btn-danger btn-sm flex-1">
        <X className="w-4 h-4" /> {optimisticStatus === "rejected" ? (isSaving ? "Saving…" : "Rejected") : "Reject"}
      </button>
    </div>
  );
}
