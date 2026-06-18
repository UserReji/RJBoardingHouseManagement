import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * POST /api/admin/payments/:id
 * Body: { status: "verified" | "rejected" }
 * Verifies or rejects a payment. When verifying, also flips the linked
 * tenant_bill to "paid" if the cumulative verified amount covers the total.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({})))?.status as string | undefined;
  if (body !== "verified" && body !== "rejected") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();
  const verified_at = body === "verified" ? new Date().toISOString() : null;

  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .update({ status: body, verified_at })
    .eq("id", id)
    .select("id, bill_id, amount")
    .single();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  if (body === "verified" && payment?.bill_id) {
    // Sum verified payments for this bill
    const { data: verified } = await supabase
      .from("payments")
      .select("amount")
      .eq("bill_id", payment.bill_id)
      .eq("status", "verified");
    const paid = (verified ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);

    // Compare to total
    const { data: bill } = await supabase
      .from("tenant_bills")
      .select("total_amount")
      .eq("id", payment.bill_id)
      .single();
    if (bill && paid >= Number(bill.total_amount)) {
      await supabase.from("tenant_bills").update({ status: "paid" }).eq("id", payment.bill_id);
    } else if (bill && paid > 0) {
      await supabase.from("tenant_bills").update({ status: "partially_paid" }).eq("id", payment.bill_id);
    }
  }

  return NextResponse.json({ ok: true });
}
