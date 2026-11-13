import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** Reopen only when no verified receipts are recorded; verified payment history must be reversed explicitly. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const [{ data: bill, error: billError }, { data: payments, error: paymentError }] = await Promise.all([
    supabase.from("tenant_bills").select("id").eq("id", id).maybeSingle(),
    supabase.from("payments").select("id").eq("bill_id", id).eq("status", "verified").limit(1),
  ]);
  if (billError || paymentError) return NextResponse.json({ error: billError?.message ?? paymentError?.message }, { status: 500 });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (payments?.length) return NextResponse.json({ error: "Reverse the verified payment first to preserve an accurate ledger." }, { status: 409 });
  const { error } = await supabase.from("tenant_bills").update({ status: "unpaid", amount_paid: 0, paid_at: null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
