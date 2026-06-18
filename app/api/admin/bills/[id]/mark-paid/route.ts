import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** POST /api/admin/bills/:id/mark-paid — flip status to 'paid'. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("tenant_bills")
    .update({ status: "paid" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
