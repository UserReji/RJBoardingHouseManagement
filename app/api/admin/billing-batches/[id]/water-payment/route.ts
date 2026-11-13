import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const paidAt = body?.paid_at ? String(body.paid_at) : null;
  if (!Number.isFinite(amount) || amount < 0 || (amount > 0 && !paidAt)) return NextResponse.json({ error: "Enter a valid amount and payment date." }, { status: 400 });
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("billing_batches").update({ water_utility_paid_amount: Math.round(amount * 100) / 100, water_paid_at: amount > 0 ? paidAt : null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
