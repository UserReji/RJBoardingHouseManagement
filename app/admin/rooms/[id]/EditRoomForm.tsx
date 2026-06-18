"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function EditRoomForm({
  roomId, initialPrice, initialDescription,
}: { roomId: string; initialPrice: number; initialDescription: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [price, setPrice] = useState(initialPrice);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price, description }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Save failed"); return; }
    toast.success("Saved");
    startTransition(() => router.refresh());
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="label">Monthly rent (₱)</label>
        <input
          type="number" min="0" step="0.01"
          value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Description (optional)</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} className="input resize-none" placeholder="e.g., corner unit, near window…"
        />
      </div>
      <button type="submit" disabled={saving || isPending} className="btn btn-primary">
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
