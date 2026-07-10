/**
 * Stripe client + price-id config (P12). Keys live in env; prices are created
 * in the Stripe dashboard and referenced by id here (commercial values live in
 * lib/pricing.ts — Stripe must be configured to match it).
 */
import "server-only";
import Stripe from "stripe";
import type { TierId } from "@/lib/pricing";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  if (!client) client = new Stripe(key);
  return client;
}

export function stripePriceIds(): { starter?: string; launch?: string; growth?: string } {
  return {
    starter: process.env.STRIPE_PRICE_STARTER,
    launch: process.env.STRIPE_PRICE_LAUNCH,
    growth: process.env.STRIPE_PRICE_GROWTH,
  };
}

export function priceIdForTier(tier: TierId): string {
  const id = stripePriceIds()[tier];
  if (!id) throw new Error(`No Stripe price configured for tier ${tier} (STRIPE_PRICE_${tier.toUpperCase()})`);
  return id;
}
