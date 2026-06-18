"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";

export default function PayButton({ billId, gcashQrUrl }: { billId: string; gcashQrUrl: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please attach a screenshot"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
    setSubmitting(true);
    try {
      // 1. Upload to public-assets/payments/<userId>/<billId>/<random>.png
      const { data: { session } } = await (await import("@/lib/supabase")).createSupabaseClient().auth.getSession();
      if (!session) { toast.error("Not signed in"); return; }
      const userId = session.user.id;
      const ext  = file.name.split(".").pop() || "png";
      const path = `payments/${userId}/${billId}/${crypto.randomUUID()}.${ext}`;
      const supa = (await import("@/lib/supabase")).createSupabaseClient();
      const { error: upErr } = await supa.storage.from("public-assets").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supa.storage.from("public-assets").getPublicUrl(path);

      // 2. Insert payment row
      const { error: insErr } = await supa.from("payments").insert({
        bill_id:               billId,
        user_id:               userId,
        amount:                0,                  // bill is fetched server-side; admin will verify exact amount
        method:                "gcash",
        screenshot_url:        urlData.publicUrl,
        gcash_reference_note:  note || null,
        status:                "pending_verification",
        paid_at:               new Date().toISOString(),
      });
      if (insErr) throw insErr;

      toast.success("Payment submitted for verification");
      setOpen(false);
      setFile(null);
      setNote("");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card p-4 border-2 border-dashed border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between"
      >
        <div className="text-left">
          <p className="font-medium text-slate-900">Pay via GCash</p>
          <p className="text-sm text-slate-500">Scan QR or upload screenshot</p>
        </div>
        <Upload className="w-5 h-5 text-blue-600" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center safe-bottom">
          <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title-md">Submit GCash Payment</h2>
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            {gcashQrUrl && (
              <div className="mb-4 text-center">
                <img src={gcashQrUrl} alt="GCash QR" className="w-40 h-40 object-contain rounded-xl border border-slate-200 p-2 bg-white mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Scan with the GCash app to pay.</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Upload screenshot</label>
                <input
                  type="file" accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm"
                />
                {file && <p className="text-sm text-green-600 mt-2">✓ {file.name}</p>}
              </div>

              <div>
                <label htmlFor="note" className="label">Reference Number (Optional)</label>
                <input
                  type="text" id="note" placeholder="e.g., GC1234567890"
                  value={note} onChange={(e) => setNote(e.target.value)} className="input"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-lg flex-1">Cancel</button>
                <button type="submit" disabled={submitting || !file} className="btn btn-primary btn-lg flex-1">
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
