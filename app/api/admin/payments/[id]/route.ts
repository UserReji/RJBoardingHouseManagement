import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = (await req.json().catch(() => ({})))?.status as string | undefined;
  if (status !== "verified" && status !== "rejected") return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const supabase = await createAdminSupabaseClient();
  const { data: payment, error } = await supabase.from("payments").update({ status, verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", id).select("bill_id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (payment?.bill_id) {
    const [{ data: verified }, { data: bill }] = await Promise.all([
      supabase.from("payments").select("amount").eq("bill_id", payment.bill_id).eq("status", "verified"),
      supabase.from("tenant_bills").select("total_amount").eq("id", payment.bill_id).single(),
    ]);
    if (bill) {
      const paid = Math.min(Number(bill.total_amount), (verified ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0));
      const fullyPaid = paid >= Number(bill.total_amount);
      const { error: billError } = await supabase.from("tenant_bills").update({
        amount_paid: paid, status: fullyPaid ? "paid" : paid > 0 ? "partially_paid" : "unpaid", paid_at: fullyPaid ? new Date().toISOString() : null,
      }).eq("id", payment.bill_id);
      if (billError) return NextResponse.json({ error: billError.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
