/**
 * Supabase client utilities — browser/client-side only.
 *
 * Anything that uses `next/headers` lives in `lib/supabase.server.ts` so this
 * file stays safe to import from `"use client"` components.
 */

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

/**
 * Browser-side Supabase client
 * Use in client components for real-time and auth operations
 */
export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Hardcoded admin credentials
 */
export const ADMIN_CREDENTIALS = {
  email: "admin1@boardhouse.local",
  password: "rjboardinghouse042791",
};

/**
 * Verify hardcoded admin credentials
 */
export function isValidAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}
