import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** POST /api/admin/bills — create a bill. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const required = ["user_id", "room_id", "billing_period_start", "billing_period_end", "total_amount"];
  for (const k of required) {
    if (body[k] == null) return NextResponse.json({ error: `${k} is required` }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("tenant_bills")
    .insert({
      user_id:               body.user_id,
      room_id:               body.room_id,
      billing_period_start:  body.billing_period_start,
      billing_period_end:    body.billing_period_end,
      room_rent:             body.room_rent ?? 0,
      extra_occupant_days:   body.extra_occupant_days ?? 0,
      extra_occupant_rate:   body.extra_occupant_rate ?? 0,
      extra_occupant_charge: body.extra_occupant_charge ?? 0,
      prev_reading_id:       body.prev_reading_id ?? null,
      curr_reading_id:       body.curr_reading_id ?? null,
      kwh_consumed:          body.kwh_consumed ?? 0,
      kwh_rate:              body.kwh_rate ?? 0,
      electricity_charge:    body.electricity_charge ?? 0,
      total_amount:          body.total_amount,
      status:                "unpaid",
      notes:                 body.notes ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
