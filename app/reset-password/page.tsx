"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createSupabaseClient } from "@/lib/supabase";
import { Home, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive && session) setHasSession(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [supabase]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { toast.error("Use at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await supabase.auth.signOut();
    setComplete(true);
  };

  return (
    <main className="min-h-dvh bg-slate-50 flex items-center justify-center p-5">
      <section className="card w-full max-w-md p-7">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500"><Home className="w-4 h-4" /> RJ BoardHouse</Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-6">Choose a new password</h1>
        <p className="text-sm text-slate-500 mt-2">Set a new password for your tenant account.</p>
        {complete ? <div className="mt-6"><p className="text-sm text-emerald-700 font-medium">Your password has been updated.</p><Link href="/login" className="btn btn-primary mt-4 w-full">Return to sign in</Link></div>
          : !ready ? <p className="text-sm text-slate-500 mt-6">Checking your reset link...</p>
          : !hasSession ? <div className="mt-6"><p className="text-sm text-amber-700">This reset link is invalid or expired. Ask the admin to send a new one.</p><button onClick={() => router.push("/login")} className="btn btn-secondary mt-4 w-full">Return to sign in</button></div>
          : <form onSubmit={submit} className="space-y-4 mt-6">
              <label className="block"><span className="label">New password</span><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-10" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div></label>
              <label className="block"><span className="label">Confirm new password</span><input className="input" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></label>
              <button disabled={saving} className="btn btn-primary w-full">{saving ? "Updating..." : "Update password"}</button>
            </form>}
      </section>
    </main>
  );
}
