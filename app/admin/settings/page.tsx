"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { Settings as SettingsIcon, Upload, Save, Zap, Users2, QrCode } from "lucide-react";
import toast from "react-hot-toast";

interface AppSettings {
  kwh_rate: number;
  extra_occupant_rate: number;
  gcash_qr_url?: string;
}

export default function AdminSettingsPage() {
  const supabase   = createSupabaseClient();
  const [settings, setSettings]  = useState<AppSettings>({ kwh_rate: 2, extra_occupant_rate: 25 });
  const [qrFile,   setQrFile]    = useState<File | null>(null);
  const [qrPreview,setQrPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving]  = useState(false);
  const [isLoading,setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      // maybeSingle() returns null instead of erroring when no row exists.
      const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      if (data) {
        setSettings({
          kwh_rate:            data.kwh_rate ?? 2,
          extra_occupant_rate: data.extra_occupant_rate ?? 25,
          gcash_qr_url:        data.gcash_qr_url ?? undefined,
        });
        if (data.gcash_qr_url) setQrPreview(data.gcash_qr_url);
      }
      setIsLoading(false);
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Save rates through the admin server route (uses service-role key).
      const ratesRes = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kwh_rate:            settings.kwh_rate,
          extra_occupant_rate: settings.extra_occupant_rate,
        }),
      });
      if (!ratesRes.ok) {
        const err = await ratesRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to save rates");
      }

      // 2. If a new QR was picked, upload it via the admin server route too.
      let gcash_qr_url = settings.gcash_qr_url;
      if (qrFile) {
        const form = new FormData();
        form.append("file", qrFile);
        const qrRes = await fetch("/api/admin/settings/qr", { method: "POST", body: form });
        if (!qrRes.ok) {
          const err = await qrRes.json().catch(() => ({}));
          throw new Error(err?.error ?? "Failed to upload QR");
        }
        const { gcash_qr_url: url } = await qrRes.json();
        gcash_qr_url = url;
      }

      setSettings((s) => ({ ...s, gcash_qr_url }));
      if (qrFile) setQrFile(null);
      toast.success("Settings saved");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading settings…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Configuration</p>
        <h1 className="text-display-md">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage rates and payment configuration.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Billing Rates */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="font-bold text-slate-800">Billing Rates</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label">Electricity Rate (₱ per kWh)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.kwh_rate}
                onChange={(e) => setSettings((s) => ({ ...s, kwh_rate: parseFloat(e.target.value) || 0 }))}
                className="input"
              />
              <p className="text-caption text-slate-400 mt-1.5">Applied to all new bills unless overridden per bill.</p>
            </div>

            <div>
              <label className="label">Extra Occupant Rate (₱ per day)</label>
              <div className="flex gap-2 mb-2">
                {[20, 25, 30].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, extra_occupant_rate: rate }))}
                    className={`btn btn-sm flex-1 ${settings.extra_occupant_rate === rate ? "btn-primary" : "btn-secondary"}`}
                  >
                    ₱{rate}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                value={settings.extra_occupant_rate}
                onChange={(e) => setSettings((s) => ({ ...s, extra_occupant_rate: parseInt(e.target.value) || 0 }))}
                className="input"
              />
              <p className="text-caption text-slate-400 mt-1.5">Daily charge for additional occupants beyond the default.</p>
            </div>
          </div>
        </div>

        {/* GCash QR */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-slate-800">GCash QR Code</h2>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Shown to tenants on the payment screen. Keep it up to date.
          </p>

          {qrPreview ? (
            <div className="mb-4">
              <img
                src={qrPreview}
                alt="GCash QR"
                className="w-40 h-40 object-contain rounded-xl border border-slate-200 p-2 bg-white"
              />
            </div>
          ) : null}

          <label className="card p-6 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center gap-2">
            <input type="file" accept="image/*" onChange={handleQrChange} className="sr-only" />
            <Upload className="w-6 h-6 text-slate-400" />
            <p className="font-medium text-sm text-slate-700">
              {qrFile ? qrFile.name : "Click to upload QR image"}
            </p>
            <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
          </label>
        </div>

        {/* Save */}
        <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </span>
          )}
        </button>
      </form>
    </div>
  );
}