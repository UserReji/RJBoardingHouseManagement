import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminSupabaseClient();
  const { data: tenant, error } = await supabase
    .from("users").select("email, role, email_confirmed_at, account_status").eq("id", id).single();
  if (error || !tenant || tenant.role !== "tenant") return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  if (!tenant.email_confirmed_at) return NextResponse.json({ error: "Tenant email must be confirmed first" }, { status: 403 });
  if (tenant.account_status === "archived") return NextResponse.json({ error: "Restore the tenant account before sending a password reset" }, { status: 403 });

  const redirectTo = new URL("/reset-password", req.url).toString();
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(tenant.email, { redirectTo });
  if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
