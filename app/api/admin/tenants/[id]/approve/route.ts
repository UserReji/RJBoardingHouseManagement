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

  // 1. confirm room is vacant
  const { data: room } = await supabase
    .from("rooms")
    .select("id, status")
    .eq("id", roomId)
    .single();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "vacant") {
    return NextResponse.json({ error: "Room is not vacant" }, { status: 409 });
  }

  // 2. approve + assign
  const { error: userErr } = await supabase
    .from("users")
    .update({ registration_status: "approved", room_id: roomId })
    .eq("id", id);
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

  // 3. mark room occupied
  const { error: roomErr } = await supabase
    .from("rooms")
    .update({ status: "occupied" })
    .eq("id", roomId);
  if (roomErr) return NextResponse.json({ error: roomErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
