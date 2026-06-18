/**
 * Session management and route protection utilities
 */

import { redirect } from "next/navigation";
import { getServerSession, getServerUser, isValidAdminCredentials } from "./supabase";
import { User, UserRole } from "./types";

/**
 * Require authenticated session, redirect to login if not found
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Require authenticated user with their profile, redirect to login if not found
 */
export async function requireUser() {
  await requireSession();
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require admin user, redirect to login if not admin
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/login");
  }
  return user;
}

/**
 * Require approved tenant user, redirect if not approved
 */
export async function requireApprovedTenant() {
  const user = await requireUser();
  if (user.role !== "tenant" || user.registration_status !== "approved") {
    redirect("/login");
  }
  return user;
}

/**
 * Get user without requiring auth (returns null if not authenticated)
 */
export async function getOptionalUser(): Promise<User | null> {
  try {
    return await getServerUser();
  } catch {
    return null;
  }
}

/**
 * Check if user is admin (client-side check based on stored credentials)
 */
export function isAdminCredentials(email: string, password: string): boolean {
  return isValidAdminCredentials(email, password);
}

/**
 * Get user role for conditional rendering
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getOptionalUser();
  return user?.role || null;
}
