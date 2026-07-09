import "server-only";

import { createClient } from "@supabase/supabase-js";
import versionsData from "./versions.json";
import { resolveConfigVersion, toResolved } from "./resolve";
import type { ResolvedConfig, StatutoryConfig, StatutoryConfigVersion } from "./types";

export type { StatutoryConfig, StatutoryConfigVersion, ResolvedConfig } from "./types";
export { resolveConfigVersion, toResolved, toIsoDate } from "./resolve";

/** Bundled seed versions — the same data seeded into config_versions. Used as a
 *  build-time fallback when no database is reachable (e.g. marketing SSG in CI
 *  without secrets). The database remains the runtime source of truth. */
const BUNDLED_VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;

type Loader = () => Promise<StatutoryConfigVersion[]>;

async function loadFromDatabase(): Promise<StatutoryConfigVersion[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // No connection configured — fall back to the bundled seed so builds and
    // pure-logic paths still resolve. Warn so this is never silent in prod.
    console.warn("[config] Supabase env not set; using bundled config versions.");
    return BUNDLED_VERSIONS;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("config_versions")
    .select("label, effective_from, status, audit_note, values")
    .neq("status", "draft");
  if (error) throw new Error(`[config] failed to load config_versions: ${error.message}`);
  return (data ?? []) as StatutoryConfigVersion[];
}

let cache: { versions: StatutoryConfigVersion[]; at: number } | null = null;
const TTL_MS = 60_000;

/**
 * The ONLY sanctioned reader of statutory values (CLAUDE.md Rule 4).
 * Returns the config live at `date` (defaults to today). `loader` is injectable
 * for tests; production reads config_versions.
 */
export async function getLiveConfig(
  date?: string | Date,
  loader: Loader = loadFromDatabase,
): Promise<ResolvedConfig> {
  const now = Date.now();
  if (!cache || now - cache.at > TTL_MS) {
    cache = { versions: await loader(), at: now };
  }
  const resolved = resolveConfigVersion(cache.versions, date ?? new Date());
  if (!resolved) {
    throw new Error(`[config] no statutory configuration in effect at ${date ?? "now"}`);
  }
  return toResolved(resolved);
}

/** Test/maintenance helper — clears the in-process cache. */
export function __clearConfigCache() {
  cache = null;
}
