"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DeleteRoomButton({ roomId, roomNumber }: { roomId: string; roomNumber: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const remove = async () => {
    if (!confirm(`Delete Room ${roomNumber}? Rooms with tenants or history cannot be deleted.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not delete room");
      toast.success("Room deleted"); router.push("/admin/rooms"); startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };
  return <button type="button" onClick={remove} disabled={saving} className="btn btn-danger btn-sm"><Trash2 className="w-4 h-4" />{saving ? "Deleting…" : "Delete room"}</button>;
}
