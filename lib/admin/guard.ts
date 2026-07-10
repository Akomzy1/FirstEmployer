/**
 * Admin allowlist guard (P14). Admin access is by email allowlist (ADMIN_EMAILS,
 * comma-separated) — non-allowlisted users are hard-blocked with a 404 so the
 * admin surface doesn't even acknowledge it exists. Data access then uses the
 * service role; every admin action re-checks the guard.
 */
import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "./allowlist";

export { adminAllowlist, isAdminEmail } from "./allowlist";

export interface AdminIdentity {
  id: string;
  email: string;
}

/** Resolve the signed-in admin or hard-block with 404. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return { id: user.id, email: user.email! };
}
