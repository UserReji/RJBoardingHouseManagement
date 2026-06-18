import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * POST /api/admin/tenants/:id/unassign-room
 * Removes the tenant's room assignment, flips the room back to vacant,
 * keeps the tenant approved (you can reject separately if needed).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();

  const { data: tenant } = await supabase
    .from("users")
    .select("room_id")
    .eq("id", id)
    .single();
  const roomId = tenant?.room_id;
  if (!roomId) return NextResponse.json({ error: "No room to unassign" }, { status: 400 });

  const { error: userErr } = await supabase
    .from("users")
    .update({ room_id: null })
    .eq("id", id);
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

  const { error: roomErr } = await supabase
    .from("rooms")
    .update({ status: "vacant" })
    .eq("id", roomId);
  if (roomErr) return NextResponse.json({ error: roomErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
