"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, KeyRound, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";

type Profile = {
  id: string; email: string; full_name: string; birthday: string | null; sex: string | null;
  permanent_address: string | null; contact_number: string | null;
  emergency_contact_name: string | null; emergency_contact_number: string | null;
  valid_id_type: string | null; valid_id_number: string | null;
};
const fields = [
  ["full_name", "Full name", "text"], ["email", "Email address", "email"],
  ["birthday", "Birthday", "date"], ["sex", "Sex", "text"],
  ["contact_number", "Contact number", "tel"], ["permanent_address", "Permanent address", "text"],
  ["emergency_contact_name", "Emergency contact name", "text"],
  ["emergency_contact_number", "Emergency contact number", "tel"],
  ["valid_id_type", "Valid ID type", "text"], ["valid_id_number", "Valid ID number", "text"],
] as const;

export default function TenantProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...profile });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${profile.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not update tenant");
      toast.success("Tenant details updated"); setEditing(false);
      startTransition(() => router.refresh());
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  };

  const sendReset = async () => {
    if (!confirm(`Send a password reset link to ${profile.email}?`)) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${profile.id}/password-reset`, { method: "POST" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not send reset email");
      toast.success("Password reset email sent");
    } catch (error) { toast.error((error as Error).message); }
    finally { setResetting(false); }
  };

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div><h2 className="font-bold text-slate-800">Tenant account &amp; information</h2><p className="text-xs text-slate-500 mt-1">Passwords cannot be viewed. Send a secure reset link instead.</p></div>
        {!editing ? <button type="button" onClick={() => setEditing(true)} className="btn btn-secondary btn-sm"><Pencil className="w-4 h-4" /> Edit details</button> : null}
      </div>
      {editing ? (
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(([key, label, type]) => <label key={key} className="block"><span className="label">{label}</span><input type={type} value={(form[key] as string | null) ?? ""} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="input" required={key === "full_name" || key === "email"} /></label>)}
          <div className="sm:col-span-2 flex gap-2 pt-2"><button disabled={saving || isPending} className="btn btn-primary btn-sm"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save changes"}</button><button type="button" disabled={saving} onClick={() => { setForm({ ...profile }); setEditing(false); }} className="btn btn-secondary btn-sm"><X className="w-4 h-4" />Cancel</button></div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Update tenant profile, contact, ID, or account email.</p><button type="button" onClick={sendReset} disabled={resetting} className="btn btn-secondary btn-sm"><KeyRound className="w-4 h-4" />{resetting ? "Sending…" : "Send password reset"}</button></div>
      )}
    </section>
  );
}
