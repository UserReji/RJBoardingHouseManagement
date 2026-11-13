import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const billId = typeof body?.bill_id === "string" ? body.bill_id : "";
  const amount = Number(body?.amount);
  if (!billId || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Choose a bill and enter a positive payment amount" }, { status: 400 });

  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("admin_record_cash_payment", { p_bill_id: billId, p_amount: amount });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 400 });
  return NextResponse.json({ ok: true, payment_id: data });
}
