import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase.server";

/**
 * POST /api/tenant/concerns/:id/reply
 * Body: { body: string }
 * Tenant adds a reply to their own concern thread. RLS ensures they can
 * only target their own concerns.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({})))?.body as string | undefined;
  if (!body || body.trim().length < 5) {
    return NextResponse.json({ error: "Reply must be at least 5 characters" }, { status: 400 });
  }

  // Confirm ownership before insert (RLS would block anyway, but a cleaner error helps)
  const { data: own } = await supabase
    .from("concerns")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (!own) return NextResponse.json({ error: "Concern not found" }, { status: 404 });

  const { error } = await supabase
    .from("concern_replies")
    .insert({ concern_id: id, sender_role: "tenant", body: body.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
