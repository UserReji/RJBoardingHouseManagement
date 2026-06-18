"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Settings as SettingsIcon, Upload } from "lucide-react";

export default function AdminSettingsPage() {
  const [kwhRate, setKwhRate] = useState(2);
  const [extraOccupantRate, setExtraOccupantRate] = useState(25);
  const [gcashQr, setGcashQr] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Upload GCash QR to Supabase Storage and save settings
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <h1 className="text-display-md">Settings</h1>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Default Rates Section */}
          <div className="card p-6 border border-slate-200">
            <h2 className="text-title-md mb-5">Default Rates</h2>

            <div className="space-y-5">
              {/* kWh Rate */}
              <div>
                <label htmlFor="kwhRate" className="label">
                  Default kWh Rate (₱/kWh)
                </label>
                <input
                  type="number"
                  id="kwhRate"
                  min="0"
                  step="0.1"
                  value={kwhRate}
                  onChange={(e) => setKwhRate(parseFloat(e.target.value))}
                  className="input"
                />
                <p className="text-caption text-slate-500 mt-2">
                  Applied to all new bills unless manually overridden
                </p>
              </div>

              {/* Extra Occupant Rate */}
              <div>
                <label htmlFor="extraOccupantRate" className="label">
                  Extra Occupant Rate (₱/day)
                </label>
                <div className="flex gap-2">
                  {[20, 25, 30].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setExtraOccupantRate(rate)}
                      className={`btn btn-sm flex-1 ${
                        extraOccupantRate === rate ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      ₱{rate}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-slate-500 mt-2">
                  Default rate for additional occupants
                </p>
              </div>
            </div>
          </div>

          {/* GCash QR Code Section */}
          <div className="card p-6 border border-slate-200">
            <h2 className="text-title-md mb-5">GCash QR Code</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Upload GCash QR Image</label>
                <p className="text-caption text-slate-600 mb-3">
                  This QR will be displayed on the landing page and bill payment screens
                </p>

                <label className="card p-8 border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGcashQr(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-900">Upload QR Code</p>
                    <p className="text-sm text-slate-500">Tap to select an image</p>
                  </div>
                </label>

                {gcashQr && (
                  <p className="text-sm text-green-600 mt-2">✓ {gcashQr.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Default Room Prices Section */}
          <div className="card p-6 border border-slate-200">
            <h2 className="text-title-md mb-5">Default Room Prices</h2>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-caption text-slate-600">Room 1</p>
                <p className="text-xl font-bold text-slate-900">₱3,500 / month</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-caption text-slate-600">Rooms 2–8</p>
                <p className="text-xl font-bold text-slate-900">₱2,500 / month</p>
              </div>
            </div>

            <p className="text-caption text-slate-500 mt-4">
              To change room prices, edit individual rooms in the Rooms section
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-6">
            <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg w-full">
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="card p-4 bg-blue-50 border-blue-200 mt-8 mb-8">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Tip:</span> Settings are applied globally unless overridden at the
            bill level.
          </p>
        </div>
      </div>
    </div>
  );
}
