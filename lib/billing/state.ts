/**
 * Subscription state machine (P12). Pure mapping from Stripe webhook facts to
 * the business's billing columns — deterministic and unit-tested offline (real
 * Stripe test-clock runs need live keys; the mapping is the logic under test).
 *
 * States on `businesses.subscription_state`: trialing | active | past_due | canceled.
 * Grace on lapse is enforced by lib/tiers.ts (read-only, documents downloadable).
 */
import type { TierId } from "@/lib/pricing";

export interface SubscriptionFacts {
  /** Stripe subscription status. */
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
    | "paused";
  /** Tier resolved from the subscription's price id, if known. */
  tier: TierId | null;
}

export interface BusinessBillingPatch {
  subscription_state: "trialing" | "active" | "past_due" | "canceled";
  tier?: TierId;
}

/** Map a Stripe subscription status onto the business row. */
export function applySubscriptionFacts(facts: SubscriptionFacts): BusinessBillingPatch {
  let state: BusinessBillingPatch["subscription_state"];
  switch (facts.status) {
    case "trialing":
      state = "trialing";
      break;
    case "active":
      state = "active";
      break;
    case "past_due":
      state = "past_due"; // grace: full access while Stripe retries
      break;
    case "unpaid":
    case "canceled":
    case "incomplete_expired":
    case "paused":
      state = "canceled"; // lapsed → read-only
      break;
    case "incomplete":
    default:
      // Checkout not finished — no change of state beyond what exists; treat as
      // trialing so a half-finished checkout never locks anyone out.
      state = "trialing";
      break;
  }
  const patch: BusinessBillingPatch = { subscription_state: state };
  if (facts.tier && (state === "active" || state === "trialing" || state === "past_due")) {
    patch.tier = facts.tier;
  }
  return patch;
}

/** Resolve a tier from a Stripe price id using env-configured price ids. */
export function tierFromPriceId(
  priceId: string | null | undefined,
  priceIds: { starter?: string; launch?: string; growth?: string },
): TierId | null {
  if (!priceId) return null;
  if (priceId === priceIds.starter) return "starter";
  if (priceId === priceIds.launch) return "launch";
  if (priceId === priceIds.growth) return "growth";
  return null;
}
