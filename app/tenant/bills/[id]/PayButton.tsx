"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { createSupabaseClient } from "@/lib/supabase";

export default function PayButton({ billId, amountDue, gcashQrUrl }: { billId: string; amountDue: number; gcashQrUrl: string | null }) {
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
    let uploadedPath: string | null = null;
    const supa = createSupabaseClient();
    try {
      const { data: { user } } = await supa.auth.getUser();
      if (!user) throw new Error("Sign in to submit a payment");
      const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "png";
      uploadedPath = `payments/${user.id}/${billId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supa.storage.from("public-assets").upload(uploadedPath, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supa.storage.from("public-assets").getPublicUrl(uploadedPath);
      const response = await fetch(`/api/tenant/bills/${billId}/payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "gcash", screenshot_url: publicUrl, gcash_reference_note: note }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not submit payment");
      uploadedPath = null;
      toast.success("GCash payment submitted. It will be marked paid after admin confirmation.");
      setOpen(false); setFile(null); setNote(""); router.refresh();
    } catch (error) {
      if (uploadedPath) await supa.storage.from("public-assets").remove([uploadedPath]);
      toast.error(error instanceof Error ? error.message : "Failed to submit payment");
    } finally { setSubmitting(false); }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="card w-full min-h-16 p-4 border-2 border-dashed border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between text-left">
      <div><p className="font-medium text-slate-900">Pay via GCash</p><p className="text-sm text-slate-600">Submit receipt for {`₱${amountDue.toLocaleString()}`}; admin will confirm it</p></div>
      <Upload className="w-5 h-5 text-blue-700 flex-shrink-0" />
    </button>
    {open && <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center safe-bottom">
      <div role="dialog" aria-modal="true" aria-labelledby="gcash-title" className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4"><h2 id="gcash-title" className="text-title-md">Submit GCash Payment</h2><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="btn btn-ghost btn-icon"><X className="w-5 h-5" /></button></div>
        <p className="rounded-lg bg-blue-50 text-slate-800 p-3 text-sm mb-4">Amount due: <strong className="tabular-nums">₱{amountDue.toLocaleString()}</strong>. Your bill remains pending until the admin confirms the payment.</p>
        {gcashQrUrl && <div className="mb-4 text-center"><img src={gcashQrUrl} alt="GCash QR" className="w-40 h-40 object-contain rounded-xl border border-slate-200 p-2 bg-white mx-auto" /><p className="text-xs text-slate-600 mt-2">Scan with the GCash app to pay.</p></div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="gcash-proof" className="label">Upload screenshot</label><input id="gcash-proof" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm" />{file && <p className="text-sm text-emerald-700 mt-2">✓ {file.name}</p>}</div>
          <div><label htmlFor="gcash-note" className="label">Reference Number (Optional)</label><input type="text" id="gcash-note" placeholder="e.g., GC1234567890" value={note} onChange={(e) => setNote(e.target.value)} className="input" /></div>
          <div className="pt-2 flex gap-3"><button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-lg flex-1">Cancel</button><button type="submit" disabled={submitting || !file} className="btn btn-primary btn-lg flex-1">{submitting ? "Submitting…" : "Submit for review"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}
