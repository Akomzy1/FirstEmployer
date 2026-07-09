/**
 * SINGLE SOURCE OF TRUTH for subscription tier prices, caps, and copy.
 * Build convention (founder-directed, DECISIONS.md P03): every consumer —
 * /lib/tiers.ts gating, the pricing page, onboarding, and Stripe — imports tier
 * data from here. No price literal may appear in a component or anywhere else.
 *
 * Canonical prices £9.99 / £14.99 / £24.99 per the founder ruling (2026-07-09),
 * matching CLAUDE.md §1 and PRD §10. To change a price, change ONLY this file.
 */

export type TierId = "starter" | "launch" | "growth";

export interface TierDef {
  id: TierId;
  name: string;
  /** Monthly price in GBP (commercial value, not statutory). */
  price: string;
  /** Maximum employee records. */
  cap: number;
  highlight?: boolean;
  tagline: string;
  for: string;
  features: string[];
}

export const TIERS: TierDef[] = [
  {
    id: "starter",
    name: "Starter",
    price: "9.99",
    cap: 1,
    tagline: "Stay compliant with one employee",
    for: "You already have one member of staff and want to keep everything in order.",
    features: [
      "Live compliance dashboard",
      "Deadline reminders",
      "1 employee record",
      "Assistant, with legal receipts",
    ],
  },
  {
    id: "launch",
    name: "Launch",
    price: "14.99",
    cap: 5,
    highlight: true,
    tagline: "Everything to hire, done properly",
    for: "You're hiring for the first time, or growing a small team.",
    features: [
      "Full first-hire journey",
      "Contracts checked by an examiner",
      "Right-to-work checks",
      "Up to 5 employees",
      "Everything in Starter",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "24.99",
    cap: 15,
    tagline: "For a growing team",
    for: "You're building a team and want room to grow.",
    features: [
      "Up to 15 employees",
      "Bulk right-to-work checks",
      "Priority examiner review",
      "Everything in Launch",
    ],
  },
];

export function getTier(id: TierId): TierDef {
  const t = TIERS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown tier: ${id}`);
  return t;
}
