import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Context) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const room_number = body?.room_number == null ? null : Number(body.room_number);
  const price = body?.price == null ? null : Number(body.price);
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  if (room_number !== null && (!Number.isInteger(room_number) || room_number < 1)) return NextResponse.json({ error: "Room number must be a positive whole number" }, { status: 400 });
  if (price !== null && (!Number.isFinite(price) || price <= 0)) return NextResponse.json({ error: "Monthly rent must be greater than zero" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (room_number !== null) updates.room_number = room_number;
  if (price !== null) { updates.price = price; updates.monthly_rent = price; }
  if (description !== null) updates.description = description || null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("rooms").update(updates).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That room number already exists" : error.message }, { status: error.code === "23505" ? 409 : 500 });
  if (!data) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Context) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const results = await Promise.all([
    supabase.from("rooms").select("id, status").eq("id", id).maybeSingle(),
    supabase.from("users").select("id").eq("room_id", id).limit(1),
    supabase.from("tenant_bills").select("id").eq("room_id", id).limit(1),
    supabase.from("tenant_contracts").select("id").eq("room_id", id).limit(1),
    supabase.from("meter_readings").select("id").eq("room_id", id).limit(1),
    supabase.from("room_photos").select("id").eq("room_id", id).limit(1),
  ]);
  const queryError = results.find((result) => result.error)?.error;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
  const [roomResult, tenantsResult, billsResult, contractsResult, readingsResult, photosResult] = results;
  const room = roomResult.data;
  const tenants = tenantsResult.data;
  const bills = billsResult.data;
  const contracts = contractsResult.data;
  const readings = readingsResult.data;
  const photos = photosResult.data;
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "occupied" || tenants?.length || bills?.length || contracts?.length || readings?.length || photos?.length) {
    return NextResponse.json({ error: "This room has a tenant or records. Move the tenant out and preserve its history; rooms with history cannot be deleted." }, { status: 409 });
  }
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
