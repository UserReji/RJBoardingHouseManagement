import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const category = String(form.get("category") ?? "");
  const roomId = String(form.get("roomId") ?? "");
  if (!(file instanceof File) || !["electricity", "water", "meter"].includes(category)) {
    return NextResponse.json({ error: "Choose a supported bill or meter image." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, or PDF under 8 MB." }, { status: 400 });
  }
  const supabase = await createAdminSupabaseClient();
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const path = `${new Date().toISOString().slice(0, 10)}/${category}/${roomId || "building"}/${crypto.randomUUID()}.${ext}`;
  const bucket = category === "water" ? "owner-private" : "public-assets";
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (bucket === "owner-private") return NextResponse.json({ path, private: true });
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
