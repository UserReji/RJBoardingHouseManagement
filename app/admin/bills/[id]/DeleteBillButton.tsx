"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeleteBillButton({ billId }: { billId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const remove = async () => {
    if (!confirm("Delete this standalone unpaid bill? Bills with payments or published billing history are retained.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bills/${billId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not delete bill");
      toast.success("Bill deleted"); router.push("/admin/bills"); startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };
  return <button onClick={remove} disabled={saving} className="btn btn-danger">{saving ? "Deleting…" : <><Trash2 className="w-4 h-4" /> Delete standalone bill</>}</button>;
}
