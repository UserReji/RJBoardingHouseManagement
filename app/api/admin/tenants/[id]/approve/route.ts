import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * POST /api/admin/tenants/:id/approve
 * Body: { room_id: string }
 * Approves the tenant, sets registration_status='approved', assigns the room,
 * and flips the room's status to 'occupied'. Atomic via RPC.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const roomId = body?.room_id as string | undefined;
  if (!roomId) return NextResponse.json({ error: "room_id required" }, { status: 400 });

  const supabase = await createAdminSupabaseClient();

  const { error } = await supabase.rpc("admin_set_tenant_room", {
    p_tenant_id: id,
    p_room_id: roomId,
    p_approve: true,
  });
  if (error) {
    const status = error.code === "P0002" ? 404 : error.code === "23505" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true });
}
