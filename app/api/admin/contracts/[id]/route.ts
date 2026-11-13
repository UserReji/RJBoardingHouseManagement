import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const supabase = await createAdminSupabaseClient();
  const { data: contract, error: readError } = await supabase.from("tenant_contracts").select("id, contract_status, start_date").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  if (body?.contract_status === "ended") {
    const endDate = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("tenant_contracts").update({ contract_status: "ended", end_date: endDate < contract.start_date ? contract.start_date : endDate }).eq("id", id).eq("contract_status", "active");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (contract.contract_status !== "active") return NextResponse.json({ error: "Ended contracts are read-only" }, { status: 409 });
  const term = Number(body?.term_months);
  const rent = Number(body?.monthly_rent);
  const deposit = Number(body?.security_deposit_months);
  const advance = Number(body?.advance_payment_months);
  const start = typeof body?.start_date === "string" ? body.start_date : "";
  const end = typeof body?.end_date === "string" ? body.end_date : "";
  if (!Number.isInteger(term) || term < 1 || !Number.isFinite(rent) || rent <= 0 || !Number.isFinite(deposit) || deposit < 0 || !Number.isFinite(advance) || advance < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start) {
    return NextResponse.json({ error: "Check the contract fields and date range." }, { status: 400 });
  }
  const { error } = await supabase.from("tenant_contracts").update({ term_months: term, monthly_rent: rent, security_deposit_months: deposit, advance_payment_months: advance, start_date: start, end_date: end }).eq("id", id).eq("contract_status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
