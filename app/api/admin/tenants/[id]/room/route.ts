import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** POST /api/admin/tenants/:id/room - assign, move, or move out a confirmed tenant. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const roomId = typeof body?.room_id === "string" && body.room_id ? body.room_id : null;
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.rpc("admin_set_tenant_room", {
    p_tenant_id: id,
    p_room_id: roomId,
    p_approve: false,
  });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "23505" ? 409 : error.code === "42501" ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}
