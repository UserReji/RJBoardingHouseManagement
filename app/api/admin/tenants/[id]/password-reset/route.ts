import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Password must be between 8 and 128 characters" }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();
  const { data: tenant, error } = await supabase
    .from("users").select("role, email_confirmed_at, account_status").eq("id", id).single();
  if (error || !tenant || tenant.role !== "tenant") return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  if (!tenant.email_confirmed_at) return NextResponse.json({ error: "Tenant email must be confirmed first" }, { status: 403 });
  if (tenant.account_status === "archived") return NextResponse.json({ error: "Restore the tenant account before changing its password" }, { status: 403 });

  const { error: updateError } = await supabase.auth.admin.updateUserById(id, { password });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
