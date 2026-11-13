import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase.server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const method = body?.method;
  const screenshot_url = typeof body?.screenshot_url === "string" ? body.screenshot_url : null;
  const gcash_reference_note = typeof body?.gcash_reference_note === "string" ? body.gcash_reference_note.trim().slice(0, 120) || null : null;
  if (method !== "cash" && method !== "gcash") return NextResponse.json({ error: "Choose a valid payment method" }, { status: 400 });
  if (method === "gcash" && !screenshot_url) return NextResponse.json({ error: "Upload your GCash receipt first" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit a payment" }, { status: 401 });
  const { data: bill, error: billError } = await supabase.from("tenant_bills").select("id, total_amount, amount_paid, status").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (billError) return NextResponse.json({ error: billError.message }, { status: 500 });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "This bill is already paid" }, { status: 409 });

  const { data: existing, error: existingError } = await supabase.from("payments").select("id").eq("bill_id", id).eq("user_id", user.id).eq("status", "pending_verification").limit(1);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (existing?.length) return NextResponse.json({ error: "A payment is already waiting for admin confirmation" }, { status: 409 });

  const amount = Math.max(0, Number(bill.total_amount) - Number(bill.amount_paid ?? 0));
  if (amount <= 0) return NextResponse.json({ error: "There is no remaining balance on this bill" }, { status: 409 });
  const { error: insertError } = await supabase.from("payments").insert({
    bill_id: id, user_id: user.id, amount, method, screenshot_url,
    gcash_reference_note, status: "pending_verification", paid_at: null,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  return NextResponse.json({ ok: true, amount });
}
