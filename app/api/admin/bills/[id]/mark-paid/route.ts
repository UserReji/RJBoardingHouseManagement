import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const { data: bill, error: readError } = await supabase.from("tenant_bills").select("total_amount, amount_paid").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  const remaining = Math.max(0, Number(bill.total_amount) - Number(bill.amount_paid ?? 0));
  if (remaining <= 0) return NextResponse.json({ error: "This bill is already fully paid" }, { status: 409 });
  const { error } = await supabase.rpc("admin_record_cash_payment", { p_bill_id: id, p_amount: remaining });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
