import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const archived = (await req.json().catch(() => ({})))?.archived;
  if (typeof archived !== "boolean") return NextResponse.json({ error: "archived must be true or false" }, { status: 400 });
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.rpc("admin_archive_tenant", { p_tenant_id: id, p_archived: archived });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "42501" ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}
