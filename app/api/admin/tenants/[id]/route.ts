import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase.admin";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const email = clean(body.email).toLowerCase();
  const full_name = clean(body.full_name);
  const birthday = clean(body.birthday) || null;
  const sex = clean(body.sex) || null;
  const permanent_address = clean(body.permanent_address) || null;
  const contact_number = clean(body.contact_number) || null;
  const emergency_contact_name = clean(body.emergency_contact_name) || null;
  const emergency_contact_number = clean(body.emergency_contact_number) || null;
  const valid_id_type = clean(body.valid_id_type) || null;
  const valid_id_number = clean(body.valid_id_number) || null;

  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  if (full_name.length < 2) return NextResponse.json({ error: "Full name must be at least 2 characters" }, { status: 400 });
  if (sex && !["Male", "Female", "Other"].includes(sex)) return NextResponse.json({ error: "Invalid sex value" }, { status: 400 });
  if (birthday && Number.isNaN(Date.parse(birthday))) return NextResponse.json({ error: "Enter a valid birthday" }, { status: 400 });
  if (contact_number && !/^[0-9+() -]{7,20}$/.test(contact_number)) return NextResponse.json({ error: "Enter a valid contact number" }, { status: 400 });
  if (emergency_contact_number && !/^[0-9+() -]{7,20}$/.test(emergency_contact_number)) return NextResponse.json({ error: "Enter a valid emergency contact number" }, { status: 400 });

  const supabase = await createAdminSupabaseClient();
  const { data: tenant, error: readError } = await supabase
    .from("users").select("id, email, role, email_confirmed_at").eq("id", id).single();
  if (readError || !tenant || tenant.role !== "tenant") return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  if (!tenant.email_confirmed_at) return NextResponse.json({ error: "Confirm the tenant email before editing this account" }, { status: 403 });

  const { data: authResult, error: authReadError } = await supabase.auth.admin.getUserById(id);
  if (authReadError || !authResult.user) return NextResponse.json({ error: authReadError?.message ?? "Auth account not found" }, { status: 404 });

  const profile = {
    full_name, birthday, sex, permanent_address, contact_number,
    emergency_contact_name, emergency_contact_number, valid_id_type, valid_id_number,
  };
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
    user_metadata: { ...authResult.user.user_metadata, ...profile },
  });
  if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 400 });

  const { error: profileError } = await supabase.from("users").update({ email, ...profile }).eq("id", id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
