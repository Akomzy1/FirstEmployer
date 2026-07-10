/**
 * Tier GATING — the single place gate logic lives (CLAUDE.md working-rules).
 * Never inline a tier check elsewhere. Tier DATA (prices/caps/copy) comes from
 * lib/pricing.ts, the single price source; this module adds enforcement.
 *
 * Server actions call the assert* helpers; UI reads the same predicates so the
 * user sees the gate before hitting it. Grace behaviour on lapse: the account
 * goes READ-ONLY — documents stay viewable and downloadable forever (users never
 * lose what they generated), but generation and new records are gated.
 */

import { TIERS, getTier, type TierDef, type TierId } from "@/lib/pricing";

export type { TierId, TierDef };
export { TIERS, getTier };

export type SubscriptionState = "trialing" | "active" | "past_due" | "canceled";

export interface BusinessBillingState {
  tier: TierId;
  subscription_state: string;
  trial_ends_at: string | null;
}

/* ------------------------- employee caps ------------------------- */

/** Employee-count limit for a tier (server-side enforcement point). */
export function employeeCap(id: TierId): number {
  return getTier(id).cap;
}

/** Whether a business on `id` may add another employee given its current count. */
export function canAddEmployee(id: TierId, currentCount: number): boolean {
  return currentCount < employeeCap(id);
}

/** The tier to offer when the cap is hit, or null when already on the top tier. */
export function upgradeTargetFor(id: TierId): TierDef | null {
  const cap = employeeCap(id);
  return TIERS.filter((t) => t.cap > cap).sort((a, b) => a.cap - b.cap)[0] ?? null;
}

/* ------------------------- subscription access ------------------------- */

/**
 * Lapsed = canceled, or a trial that ran out without converting. past_due keeps
 * full access (Stripe is retrying payment — grace, not punishment).
 */
export function isLapsed(b: BusinessBillingState, now = new Date()): boolean {
  if (b.subscription_state === "canceled") return true;
  if (b.subscription_state === "trialing" && b.trial_ends_at) {
    return new Date(b.trial_ends_at).getTime() < now.getTime();
  }
  return false;
}

/** Read-only on lapse: viewing and downloading stay; mutation is gated. */
export function isReadOnly(b: BusinessBillingState, now = new Date()): boolean {
  return isLapsed(b, now);
}

/** Whether the GENERATION journey (setup + contracts + variations) is available:
 *  requires a generation tier (PRD §10: Starter is monitoring-only) AND a live
 *  subscription. Documents already generated remain downloadable regardless. */
export function canGenerate(b: BusinessBillingState, now = new Date()): boolean {
  return getTier(b.tier as TierId).generation && !isLapsed(b, now);
}

/* ------------------------- assert helpers (server actions) ------------------------- */

export class TierGateError extends Error {
  constructor(
    message: string,
    public readonly code: "employee_cap" | "read_only" | "generation_tier",
    public readonly upgradeTo: TierId | null,
  ) {
    super(message);
    this.name = "TierGateError";
  }
}

/** Throws when the business may not add another employee. */
export function assertCanAddEmployee(b: BusinessBillingState, currentCount: number): void {
  if (isReadOnly(b)) {
    throw new TierGateError("Your subscription has ended, so the account is read-only. Restart it to add people.", "read_only", null);
  }
  const tier = b.tier as TierId;
  if (!canAddEmployee(tier, currentCount)) {
    const target = upgradeTargetFor(tier);
    throw new TierGateError(
      `The ${getTier(tier).name} plan covers up to ${employeeCap(tier)} employees.` +
        (target ? ` Upgrade to ${target.name} for up to ${target.cap}.` : ""),
      "employee_cap",
      target?.id ?? null,
    );
  }
}

/** Throws when document generation is unavailable (tier or lapse). */
export function assertCanGenerate(b: BusinessBillingState): void {
  if (isReadOnly(b)) {
    throw new TierGateError(
      "Your subscription has ended, so the account is read-only. Your documents are still here to download — restart your plan to generate new ones.",
      "read_only",
      null,
    );
  }
  if (!canGenerate(b)) {
    throw new TierGateError(
      "The Starter plan monitors what you already have. Upgrade to Launch to generate examined documents.",
      "generation_tier",
      "launch",
    );
  }
}
