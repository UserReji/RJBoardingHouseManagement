"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { Check, Eye, EyeOff, Home, KeyRound, Lock, Mail } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let alive = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive && session) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setHasSession(Boolean(data.session));
      if (error) setFormError("We couldn’t validate this reset link. Request a new one from the administrator.");
      setReady(true);
    }).catch(() => {
      if (!alive) return;
      setFormError("We couldn’t validate this reset link. Check your connection and try again.");
      setReady(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [supabase]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (password.length < 8) {
      setFormError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("The passwords don’t match. Check both fields and try again.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError(error.message);
        return;
      }
      setComplete(true);
      await supabase.auth.signOut();
    } catch {
      setFormError("Your password couldn’t be updated. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
          <Home className="w-4 h-4" /> RJ BoardHouse
        </Link>
      </div>

      <main className="auth-layout">
        <aside className="auth-intro">
          <span className="auth-kicker">RJ BoardHouse · Davao City</span>
          <h1>A fresh start for your account.</h1>
          <p>Choose a new password to get back to your tenant portal and keep your account details private.</p>
          <div className="auth-points">
            <span><KeyRound size={16} /> Use a password you haven’t used here before</span>
            <span><Check size={16} /> At least 8 characters</span>
            <span><Lock size={16} /> Your password stays private</span>
          </div>
          <span className="auth-orbit" aria-hidden="true" />
        </aside>

        <div className="auth-form-column">
          <header className="auth-heading">
            <div className="auth-mark"><KeyRound className="w-6 h-6" /></div>
            <h2>{complete ? "Password updated" : "Reset password"}</h2>
            <p>{complete ? "Your account is ready for you to sign in." : "Set a new password for your tenant account."}</p>
          </header>

          <section className="auth-card" aria-live="polite">
            {!ready ? (
              <div className="py-5" role="status" aria-label="Checking reset link">
                <div className="w-9 h-9 mx-auto mb-4 rounded-full border-[3px] border-slate-200 border-t-blue-700 animate-spin" />
                <p className="text-center text-sm text-slate-600">Checking your secure reset link…</p>
              </div>
            ) : complete ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center">
                  <Check className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-900">Your password has been changed.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with your new password to continue to your tenant account.</p>
                <Link href="/login" className="btn btn-primary btn-lg w-full mt-6">Return to sign in</Link>
              </div>
            ) : !hasSession ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-700 grid place-items-center">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900">This reset link can’t be used</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">It may have expired or already been used. Contact the administrator to request another reset email.</p>
                {formError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-left text-sm text-red-700">{formError}</p>}
                <Link href="/login" className="btn btn-secondary btn-lg w-full mt-6">Back to sign in</Link>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <p className="text-sm leading-6 text-slate-600 mb-1">Use at least 8 characters. Enter it again so we can check for typos.</p>
                <div>
                  <label htmlFor="new-password" className="label">New password</label>
                  <div className="relative">
                    <Lock aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input id="new-password" className="input pl-10 pr-12" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => { setPassword(event.target.value); setFormError(""); }} required aria-describedby="password-hint" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p id="password-hint" className="mt-1.5 text-xs text-slate-500">At least 8 characters</p>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="label">Confirm new password</label>
                  <div className="relative">
                    <Lock aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input id="confirm-password" className="input pl-10 pr-12" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFormError(""); }} required />
                    <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">{formError}</p>}
                <button type="submit" disabled={saving || !password || !confirmPassword} className="btn btn-primary btn-lg w-full">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating password…</> : "Save new password"}
                </button>
              </form>
            )}
          </section>
          {!complete && <p className="text-center text-sm text-slate-500 mt-5">Remember your password? <Link href="/login" className="font-semibold text-blue-700 hover:underline">Sign in</Link></p>}
        </div>
      </main>

      <footer className="auth-footer">© 2025 RJ BoardHouse</footer>
    </div>
  );
}
