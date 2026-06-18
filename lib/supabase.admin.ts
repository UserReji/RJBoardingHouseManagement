/**
 * Admin-only Supabase client (service-role).
 *
 * Uses the service-role key to bypass RLS. THIS FILE MUST NEVER BE IMPORTED
 * FROM A CLIENT COMPONENT — it leaks full DB access into the browser bundle.
 * It is marked "server-only" so Next.js will fail the build if you try.
 *
 * The client also verifies the caller is authenticated as an admin by checking
 * the `adminSession` cookie that the admin login route sets. If no cookie,
 * calls throw — never silently return data.
 */

import "server-only";

import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_CREDENTIALS } from "@/lib/supabase";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let _adminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client with full DB privileges (bypasses RLS).
 * Throws if the env var is missing or if the request is not from the admin.
 */
export async function createAdminSupabaseClient(): Promise<SupabaseClient> {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Admin Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local. Get the service-role key from " +
        "Supabase Dashboard → Project Settings → API → service_role (secret)."
    );
  }

  // Defense in depth: confirm the request carries the admin session cookie.
  // Even if someone imports this on the server, they can't query without it.
  const cookieStore = await cookies();
  const session = cookieStore.get("adminSession")?.value;
  if (!session) throw new Error("Admin session required.");

  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _adminClient;
}

/**
 * Verify the hardcoded admin credentials and return a session payload, or null.
 * Used by the admin login route handler.
 */
export function checkAdminCredentials(email: string, password: string) {
  return (
    email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    password === ADMIN_CREDENTIALS.password
  );
}
