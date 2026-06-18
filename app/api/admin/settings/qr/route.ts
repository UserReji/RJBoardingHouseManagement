import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * POST /api/admin/settings/qr
 * multipart/form-data with `file` field.
 * Uploads the GCash QR image to public-assets/gcash-qr/qr.<ext> and
 * persists the public URL on the settings row.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();

  const ext  = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `gcash-qr/qr.${ext}`;

  // Convert File → ArrayBuffer → Blob for the SDK
  const bytes = await file.arrayBuffer();
  const blob  = new Blob([bytes], { type: file.type });

  const { error: upErr } = await supabase.storage
    .from("public-assets")
    .upload(path, blob, { upsert: true, contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("public-assets").getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { error: persistErr } = await supabase
    .from("settings")
    .upsert(
      { id: 1, gcash_qr_url: publicUrl, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (persistErr) return NextResponse.json({ error: persistErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, gcash_qr_url: publicUrl });
}
