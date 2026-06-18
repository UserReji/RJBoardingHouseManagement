"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyRejectButtons({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const set = async (status: "verified" | "rejected") => {
    const res = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success(status === "verified" ? "Verified" : "Rejected");
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex gap-2 pt-4 border-t border-slate-100">
      <button onClick={() => set("verified")} disabled={isPending} className="btn btn-primary btn-sm flex-1">
        <Check className="w-4 h-4" /> Verify
      </button>
      <button onClick={() => set("rejected")} disabled={isPending} className="btn btn-danger btn-sm flex-1">
        <X className="w-4 h-4" /> Reject
      </button>
    </div>
  );
}
