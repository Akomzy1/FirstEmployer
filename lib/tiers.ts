/**
 * Tier GATING — the single place gate logic lives (CLAUDE.md working-rules).
 * Never inline a tier check elsewhere. Tier DATA (prices/caps/copy) comes from
 * lib/pricing.ts, the single price source; this module adds enforcement.
 */

import { TIERS, getTier, type TierDef, type TierId } from "@/lib/pricing";

export type { TierId, TierDef };
export { TIERS, getTier };

/** Employee-count limit for a tier (server-side enforcement point). */
export function employeeCap(id: TierId): number {
  return getTier(id).cap;
}

/** Whether a business on `id` may add another employee given its current count. */
export function canAddEmployee(id: TierId, currentCount: number): boolean {
  return currentCount < employeeCap(id);
}
