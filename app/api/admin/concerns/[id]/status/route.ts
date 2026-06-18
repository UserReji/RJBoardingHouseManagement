import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

/**
 * POST /api/admin/concerns/:id/status
 * Body: { status: "open" | "in_progress" | "resolved" }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({})))?.status as string | undefined;
  if (!["open", "in_progress", "resolved"].includes(body ?? "")) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase
    .from("concerns")
    .update({ status: body })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
