import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * GET  /api/admin/settings — returns the current settings row (or null).
 * POST /api/admin/settings — updates the settings row.
 *
 * Both go through the service-role client because the admin does not have
 * a Supabase auth session (hardcoded credentials + adminSession cookie).
 * RLS on the `settings` table only allows `authenticated` to read, so the
 * page can NOT read directly with the anon key.
 */

export async function GET() {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("settings")
    .select("kwh_rate, extra_occupant_rate, gcash_qr_url")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data ?? null });
}

/**
 * POST /api/admin/settings
 * Body: { kwh_rate: number; extra_occupant_rate: number }
 * Admin writes to the `settings` row (id = 1) using the service-role client.
 * The QR upload itself is a separate call to /api/admin/settings/qr.
 */
export async function POST(req: Request) {
  let body: { kwh_rate?: number; extra_occupant_rate?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const kwh_rate            = Number(body.kwh_rate);
  const extra_occupant_rate = Number(body.extra_occupant_rate);
  if (!Number.isFinite(kwh_rate) || kwh_rate < 0) {
    return NextResponse.json({ error: "Invalid kwh_rate" }, { status: 400 });
  }
  if (!Number.isFinite(extra_occupant_rate) || extra_occupant_rate < 0) {
    return NextResponse.json({ error: "Invalid extra_occupant_rate" }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { id: 1, kwh_rate, extra_occupant_rate, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
