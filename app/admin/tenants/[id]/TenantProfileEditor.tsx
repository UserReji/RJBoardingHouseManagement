"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, KeyRound, Pencil, X, Eye, EyeOff, Copy } from "lucide-react";
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
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetDone, setPasswordResetDone] = useState(false);
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

  const sendReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) { toast.error("Use at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${profile.id}/password-reset`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Could not update tenant password");
      setPasswordResetDone(true);
      toast.success("Tenant password updated");
    } catch (error) { toast.error((error as Error).message); }
    finally { setResetting(false); }
  };

  const copyTemporaryPassword = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      toast.success("Temporary password copied");
    } catch {
      toast.error("Could not copy password. Select and copy it manually.");
    }
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
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Update tenant profile, contact, ID, or account email.</p><button type="button" onClick={() => { setShowPasswordPanel((open) => !open); setPasswordResetDone(false); }} className="btn btn-secondary btn-sm"><KeyRound className="w-4 h-4" />{showPasswordPanel ? "Close password reset" : "Set temporary password"}</button></div>
      )}
      {showPasswordPanel && !editing && (
        <form onSubmit={sendReset} className="mt-5 border-t border-slate-100 pt-5 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-950">This changes the tenant’s password immediately.</p>
            <p className="mt-1 text-sm leading-5 text-amber-900">No email will be sent. Share the temporary password with the tenant directly.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block"><span className="label">New temporary password</span><div className="relative"><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setPasswordResetDone(false); }} className="input pr-12" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide temporary password" : "Show temporary password"} className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><span className="mt-1 block text-xs text-slate-500">Use at least 8 characters.</span></label>
            <label className="block"><span className="label">Confirm temporary password</span><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setPasswordResetDone(false); }} className="input" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={resetting || !newPassword || !confirmPassword} className="btn btn-primary btn-sm"><KeyRound className="w-4 h-4" />{resetting ? "Updating password…" : "Update password"}</button>
            {passwordResetDone && <button type="button" onClick={copyTemporaryPassword} className="btn btn-secondary btn-sm"><Copy className="w-4 h-4" />Copy temporary password</button>}
            {passwordResetDone && <span role="status" className="text-sm text-emerald-700">Password updated. Share it directly with the tenant.</span>}
          </div>
        </form>
      )}
    </section>
  );
}
