import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const room_number = Number(body?.room_number);
  const monthly_rent = Number(body?.monthly_rent);
  const description = typeof body?.description === "string" ? body.description.trim() || null : null;
  if (!Number.isInteger(room_number) || room_number < 1) return NextResponse.json({ error: "Room number must be a positive whole number" }, { status: 400 });
  if (!Number.isFinite(monthly_rent) || monthly_rent <= 0) return NextResponse.json({ error: "Monthly rent must be greater than zero" }, { status: 400 });

  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("rooms").insert({ room_number, price: monthly_rent, monthly_rent, description, status: "vacant" }).select("id").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That room number already exists" : error.message }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
