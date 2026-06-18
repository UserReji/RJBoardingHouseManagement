import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** POST /api/admin/rooms/:id — update price/description. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const price       = body?.price != null ? Number(body.price) : null;
  const description = body?.description ?? null;

  const supabase = await createAdminSupabaseClient();
  const updates: Record<string, unknown> = {};
  if (price != null) {
    updates.price        = price;
    updates.monthly_rent = price;
  }
  if (description != null) updates.description = description;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const { error } = await supabase.from("rooms").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
