/**
 * Supabase client utilities
 */

import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";

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
 * Server-side Supabase client (for use in Server Components, Route Handlers, Server Actions)
 * Reads/writes the auth session via Next.js cookies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component (read-only context) — ignore.
        }
      },
    },
  });
}

/**
 * Get the current authenticated user (with profile) from the server.
 * Returns null when no session.
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  return profile ?? null;
}

/**
 * Get the current Supabase session (lightweight wrapper).
 * Returns null when no session.
 */
export async function getServerSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
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

