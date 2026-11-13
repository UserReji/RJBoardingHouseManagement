import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/** POST /api/admin/tenants/:id/reject */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();

  const { error } = await supabase
    .from("users")
    .update({ registration_status: "rejected" })
    .eq("id", id)
    .not("email_confirmed_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
