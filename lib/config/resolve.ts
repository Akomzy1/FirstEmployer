import type { ResolvedConfig, StatutoryConfigVersion } from "./types";

/**
 * Normalise a date input to an ISO date string (YYYY-MM-DD), in UTC.
 * ISO date strings compare correctly with `<=`/`localeCompare`, which sidesteps
 * the timezone off-by-one bugs that plague Date arithmetic — critical for a
 * deterministic config resolver whose output must be byte-identical.
 */
export function toIsoDate(input: string | Date): string {
  if (typeof input === "string") {
    // Accept full ISO timestamps too; keep only the date part.
    return input.slice(0, 10);
  }
  return input.toISOString().slice(0, 10);
}

/**
 * Pure resolution: the statutory version live at `at` is the one with the
 * greatest effective_from on or before that date, ignoring drafts. Returns null
 * if no version is yet in effect.
 *
 * Deterministic and side-effect-free — this is the tested core of Rule 4.
 */
export function resolveConfigVersion(
  versions: StatutoryConfigVersion[],
  at: string | Date,
): StatutoryConfigVersion | null {
  const target = toIsoDate(at);
  const eligible = versions
    .filter((v) => v.status !== "draft")
    .filter((v) => toIsoDate(v.effective_from) <= target)
    .sort((a, b) => toIsoDate(b.effective_from).localeCompare(toIsoDate(a.effective_from)));
  return eligible[0] ?? null;
}

export function toResolved(version: StatutoryConfigVersion): ResolvedConfig {
  return {
    label: version.label,
    effectiveFrom: toIsoDate(version.effective_from),
    values: version.values,
  };
}
