import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

function addMonths(dateText: string, months: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const targetMonth = month - 1 + months;
  const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, targetMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const term = Number(body?.term_months);
  const rent = Number(body?.monthly_rent);
  const deposit = Number(body?.security_deposit_months ?? 0);
  const advance = Number(body?.advance_payment_months ?? 0);
  const start = typeof body?.start_date === "string" ? body.start_date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isInteger(term) || term < 1 || term > 120 || !Number.isFinite(rent) || rent <= 0 || !Number.isFinite(deposit) || deposit < 0 || !Number.isFinite(advance) || advance < 0) {
    return NextResponse.json({ error: "Check the contract dates, term, rent, deposit, and advance." }, { status: 400 });
  }
  const end = addMonths(start, term);
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("admin_create_tenant_contract", {
    p_tenant_id: id, p_term_months: term, p_start_date: start, p_end_date: end,
    p_monthly_rent: rent, p_security_deposit_months: deposit, p_advance_payment_months: advance,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 400 });
  return NextResponse.json({ ok: true, id: data });
}
