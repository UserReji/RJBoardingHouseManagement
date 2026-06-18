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
      const { data } = await supabase.from("settings").select("*").single();
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
      let gcash_qr_url = settings.gcash_qr_url;

      // Upload QR if new file selected
      if (qrFile) {
        const ext  = qrFile.name.split(".").pop();
        const path = `gcash-qr/qr.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("public-assets")
          .upload(path, qrFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("public-assets").getPublicUrl(path);
        gcash_qr_url = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("settings")
        .upsert({ id: 1, ...settings, gcash_qr_url }, { onConflict: "id" });

      if (error) throw error;
      setSettings((s) => ({ ...s, gcash_qr_url }));
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
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
