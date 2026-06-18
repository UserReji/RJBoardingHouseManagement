import { NextResponse } from "next/server";

/** POST /api/admin/logout — clears the admin session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("adminSession", "", { path: "/", maxAge: 0 });
  return res;
}
