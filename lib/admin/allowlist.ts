/** Pure allowlist predicate (testable offline; the server guard builds on it). */
export function adminAllowlist(env = process.env.ADMIN_EMAILS): string[] {
  return (env ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined, allowlist = adminAllowlist()): boolean {
  if (!email) return false;
  return allowlist.includes(email.trim().toLowerCase());
}
