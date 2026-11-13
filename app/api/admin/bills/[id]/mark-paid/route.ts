import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createAdminSupabaseClient();
  const { data: bill, error: readError } = await supabase.from("tenant_bills").select("total_amount").eq("id", id).single();
  if (readError || !bill) return NextResponse.json({ error: readError?.message ?? "Bill not found" }, { status: 404 });
  const { error } = await supabase.from("tenant_bills").update({ status: "paid", amount_paid: bill.total_amount, paid_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
