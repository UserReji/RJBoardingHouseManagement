"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";

type Room = { id: string; room_number: number };

export default function InlineApprove({
  tenantId,
  availableRooms,
}: { tenantId: string; availableRooms: Room[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roomId, setRoomId] = useState("");

  const approve = async () => {
    if (!roomId) { toast.error("Pick a room first"); return; }
    const res = await fetch(`/api/admin/tenants/${tenantId}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to approve"); return;
    }
    toast.success("Approved");
    setRoomId("");
    startTransition(() => router.refresh());
  };

  const reject = async () => {
    if (!confirm("Reject this registration?")) return;
    const res = await fetch(`/api/admin/tenants/${tenantId}/reject`, { method: "POST" });
    if (!res.ok) { toast.error("Failed to reject"); return; }
    toast.success("Rejected");
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        disabled={isPending}
        className="select flex-1 sm:max-w-[140px] text-sm"
      >
        <option value="">Assign room…</option>
        {availableRooms.map((r) => (
          <option key={r.id} value={r.id}>Room {r.room_number}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={isPending || !roomId}
          className="btn btn-primary btn-sm"
          aria-label="Approve"
        >
          <Check className="w-3.5 h-3.5" /> Approve
        </button>
        <button
          onClick={reject}
          disabled={isPending}
          className="btn btn-danger btn-sm"
          aria-label="Reject"
        >
          <X className="w-3.5 h-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}
