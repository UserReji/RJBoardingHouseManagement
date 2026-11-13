import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** POST /api/admin/tenants/:id/unassign-room - move out and free the room safely. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.rpc("admin_set_tenant_room", {
    p_tenant_id: id,
    p_room_id: null,
    p_approve: false,
  });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "42501" ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}
