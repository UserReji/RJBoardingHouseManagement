"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";

type Room = { id: string; room_number: number };

export default function TenantActions({
  tenantId,
  currentStatus,
  currentRoomId,
  availableRooms,
}: {
  tenantId: string;
  currentStatus: "pending" | "approved" | "rejected";
  currentRoomId: string | null;
  availableRooms: Room[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showApprove, setShowApprove] = useState(false);
  const [roomId, setRoomId] = useState<string>(currentRoomId ?? "");

  const call = async (action: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/tenants/${tenantId}/${action}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Failed to ${action}`);
    }
  };

  const refresh = () => {
    setShowApprove(false);
    startTransition(() => router.refresh());
  };

  const handleApprove = async () => {
    if (!roomId) { toast.error("Pick a room first"); return; }
    try {
      await call("approve", { room_id: roomId });
      toast.success("Tenant approved");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleReject = async () => {
    if (!confirm("Reject this registration? This cannot be undone.")) return;
    try {
      await call("reject", {});
      toast.success("Tenant rejected");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleUnassign = async () => {
    if (!confirm("Remove this tenant from their room? The room will be marked vacant.")) return;
    try {
      await call("unassign-room", {});
      toast.success("Room unassigned");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (currentStatus === "approved") {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="badge badge-success">Approved</span>
        {currentRoomId && (
          <button
            onClick={handleUnassign}
            disabled={isPending}
            className="btn btn-secondary btn-sm"
          >
            Unassign room
          </button>
        )}
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return <span className="badge badge-danger">Rejected</span>;
  }

  // pending
  return (
    <div className="space-y-2">
      {!showApprove ? (
        <div className="flex gap-2">
          <button onClick={() => setShowApprove(true)} disabled={isPending} className="btn btn-primary btn-sm flex-1">
            <UserCheck className="w-4 h-4" /> Approve
          </button>
          <button onClick={handleReject} disabled={isPending} className="btn btn-danger btn-sm flex-1">
            <UserX className="w-4 h-4" /> Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="select"
            disabled={isPending}
          >
            <option value="">Assign a room…</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>Room {r.room_number}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleApprove} disabled={isPending || !roomId} className="btn btn-primary btn-sm flex-1">
              <Check className="w-4 h-4" /> Confirm
            </button>
            <button onClick={() => setShowApprove(false)} className="btn btn-secondary btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
