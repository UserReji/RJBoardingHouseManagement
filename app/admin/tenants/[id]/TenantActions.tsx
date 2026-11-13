"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, UserCheck, UserX, DoorOpen, Save, Archive, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

type Room = { id: string; room_number: number };

export default function TenantActions({
  tenantId,
  currentStatus,
  accountStatus,
  currentRoomId,
  availableRooms,
}: {
  tenantId: string;
  currentStatus: "pending" | "approved" | "rejected";
  accountStatus: "active" | "archived";
  currentRoomId: string | null;
  availableRooms: Room[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showApprove, setShowApprove] = useState(false);
  const [showRoomEditor, setShowRoomEditor] = useState(false);
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

  const handleArchive = async (archived: boolean) => {
    const message = archived
      ? "Archive this tenant and move them out? Their bills, payments, and profile history will be kept."
      : "Restore this tenant account? They will still need a room assignment to be housed.";
    if (!confirm(message)) return;
    try {
      await call("archive", { archived });
      toast.success(archived ? "Tenant archived and room released" : "Tenant account restored");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleRoomChange = async () => {
    if (roomId === (currentRoomId ?? "")) { setShowRoomEditor(false); return; }
    const destination = roomId ? `Room ${availableRooms.find((r) => r.id === roomId)?.room_number}` : "no room (move out)";
    if (!confirm(`Move this tenant to ${destination}?`)) return;
    try {
      await call("room", { room_id: roomId || null });
      toast.success(roomId ? "Room assignment updated" : "Tenant moved out; room made available");
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (accountStatus === "archived") {
    return <div className="flex flex-wrap items-center gap-2"><span className="badge badge-slate">Archived</span><button onClick={() => handleArchive(false)} disabled={isPending} className="btn btn-secondary btn-sm"><RotateCcw className="w-4 h-4" /> Restore account</button></div>;
  }

  if (currentStatus === "approved") {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="badge badge-success">Approved</span>
        {!showRoomEditor ? (
          <button onClick={() => setShowRoomEditor(true)} disabled={isPending} className="btn btn-secondary btn-sm">
            <DoorOpen className="w-4 h-4" /> {currentRoomId ? "Change room / move out" : "Assign room"}
          </button>
        ) : (
          <div className="flex flex-wrap gap-2 w-full pt-2">
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={isPending} className="select flex-1 min-w-[180px]">
              <option value="">No room - moved out</option>
              {availableRooms.map((r) => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
            </select>
            <button onClick={handleRoomChange} disabled={isPending} className="btn btn-primary btn-sm"><Save className="w-4 h-4" /> Save</button>
            <button onClick={() => { setRoomId(currentRoomId ?? ""); setShowRoomEditor(false); }} disabled={isPending} className="btn btn-secondary btn-sm"><X className="w-4 h-4" /></button>
          </div>
        )}
        <button onClick={() => handleArchive(true)} disabled={isPending} className="btn btn-ghost btn-sm text-slate-600"><Archive className="w-4 h-4" /> Archive tenant</button>
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
            <option value="">Assign a room...</option>
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
