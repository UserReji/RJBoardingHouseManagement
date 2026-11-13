import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const label = String(body?.label ?? "").trim(); const reason = String(body?.reason ?? "").trim();
  const amount = Number(body?.amount); const type = body?.type;
  if (!label || label.length > 100 || !reason || reason.length > 500 || !Number.isFinite(amount) || amount <= 0 || !["charge", "credit"].includes(type)) {
    return NextResponse.json({ error: "Enter a description, positive amount, and adjustment reason." }, { status: 400 });
  }
  const supabase = await createAdminSupabaseClient();
  const { data: bill, error } = await supabase.from("tenant_bills").select("id, user_id, total_amount, amount_paid, credit_balance").eq("id", id).single();
  if (error || !bill) return NextResponse.json({ error: error?.message ?? "Bill not found" }, { status: 404 });
  const signed = type === "charge" ? amount : -amount;
  const rawTotal = Math.round((Number(bill.total_amount) + signed + Number.EPSILON) * 100) / 100;
  const nextTotal = Math.max(0, rawTotal);
  const extraCredit = Math.max(0, Number(bill.amount_paid ?? 0) - nextTotal);
  const nextCredit = Math.round((Math.max(0, -rawTotal) + extraCredit + Number.EPSILON) * 100) / 100;
  const paid = Number(bill.amount_paid ?? 0);
  const status = paid >= nextTotal ? "paid" : paid > 0 ? "partially_paid" : "unpaid";
  const { error: lineError } = await supabase.from("bill_line_items").insert({ bill_id: id, label, amount, item_type: type, adjustment_note: reason, sort_order: Date.now() });
  if (lineError) return NextResponse.json({ error: lineError.message }, { status: 500 });
  const { error: updateError } = await supabase.from("tenant_bills").update({ total_amount: nextTotal, credit_balance: nextCredit, status, paid_at: status === "paid" ? new Date().toISOString() : null }).eq("id", id);
  if (updateError) { await supabase.from("bill_line_items").delete().eq("bill_id", id).eq("adjustment_note", reason).eq("label", label).eq("amount", amount); return NextResponse.json({ error: updateError.message }, { status: 500 }); }
  const { data: tenant } = await supabase.from("users").select("billing_credit").eq("id", bill.user_id).single();
  const updatedCredit = Math.max(0, Number(tenant?.billing_credit ?? 0) - Number(bill.credit_balance ?? 0) + nextCredit);
  const { error: creditError } = await supabase.from("users").update({ billing_credit: updatedCredit }).eq("id", bill.user_id);
  if (creditError) return NextResponse.json({ error: creditError.message }, { status: 500 });
  return NextResponse.json({ ok: true, total_amount: nextTotal, credit_balance: nextCredit });
}

