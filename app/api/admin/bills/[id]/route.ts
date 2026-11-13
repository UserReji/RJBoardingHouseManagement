import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const [{ data: bill, error: billError }, { data: payments, error: paymentError }] = await Promise.all([
    supabase.from("tenant_bills").select("id, status, amount_paid, billing_batch_id").eq("id", id).maybeSingle(),
    supabase.from("payments").select("id").eq("bill_id", id).limit(1),
  ]);
  if (billError || paymentError) return NextResponse.json({ error: billError?.message ?? paymentError?.message }, { status: 500 });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (bill.status !== "unpaid" || Number(bill.amount_paid ?? 0) > 0 || payments?.length || bill.billing_batch_id) {
    return NextResponse.json({ error: "Only standalone unpaid bills with no payments can be deleted. Published billing history is preserved." }, { status: 409 });
  }
  const { error } = await supabase.from("tenant_bills").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
