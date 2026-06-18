"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Action = "mark-paid" | "mark-unpaid";

export default function BillStatusButton({
  billId, action, label, className,
}: { billId: string; action: Action; label: string; className: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = async () => {
    const res = await fetch(`/api/admin/bills/${billId}/${action}`, { method: "POST" });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success("Updated");
    startTransition(() => router.refresh());
  };

  return (
    <button onClick={onClick} disabled={isPending} className={className}>
      {label}
    </button>
  );
}
