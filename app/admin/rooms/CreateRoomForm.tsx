"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateRoomForm() {
  const router = useRouter();
  const [room_number, setRoomNumber] = useState("");
  const [monthly_rent, setMonthlyRent] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/admin/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room_number, monthly_rent, description }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not create room");
      toast.success("Room created"); setRoomNumber(""); setMonthlyRent(""); setDescription("");
      startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };

  return <form onSubmit={submit} className="card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
    <label><span className="label">Room number</span><input className="input" type="number" min="1" step="1" required value={room_number} onChange={(e) => setRoomNumber(e.target.value)} /></label>
    <label><span className="label">Monthly rent (₱)</span><input className="input" type="number" min="0.01" step="0.01" required value={monthly_rent} onChange={(e) => setMonthlyRent(e.target.value)} /></label>
    <label className="sm:col-span-2"><span className="label">Description</span><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional room notes" /></label>
    <button disabled={saving} className="btn btn-primary sm:col-span-4 justify-center"><Plus className="w-4 h-4" />{saving ? "Creating…" : "Add room"}</button>
  </form>;
}
