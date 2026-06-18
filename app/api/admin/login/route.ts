import { NextResponse } from "next/server";
import { checkAdminCredentials } from "@/lib/supabase.admin";

/**
 * POST /api/admin/login
 * Body: { email: string; password: string }
 * Sets the `adminSession` cookie on success so server-side admin actions
 * (e.g. bills, tenant approvals) can use the service-role Supabase client.
 */
export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "");
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!checkAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("adminSession", JSON.stringify({ email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 8-hour shift
    maxAge: 60 * 60 * 8,
  });
  return res;
}
