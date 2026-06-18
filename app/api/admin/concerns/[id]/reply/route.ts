import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * POST /api/admin/concerns/:id/reply
 * Body: { body: string } — admin sends a reply to a concern thread.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({})))?.body as string | undefined;
  if (!body || body.trim().length < 5) {
    return NextResponse.json({ error: "Reply must be at least 5 characters" }, { status: 400 });
  }
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("concern_replies")
    .insert({ concern_id: id, sender_role: "admin", body: body.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
