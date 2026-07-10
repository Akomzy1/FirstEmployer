/**
 * Billing + tier gate goldens (P12 VERIFY). Live Stripe test clocks need real
 * keys, so the state machine and the gates — the actual logic — are pinned here
 * offline: trial → active → past_due → canceled transitions, the 4th-employee
 * block on Starter with an upgrade path, lapsed read-only grace, and Starter's
 * monitoring-only generation gate.
 */
import { describe, expect, it } from "vitest";
import { applySubscriptionFacts, tierFromPriceId } from "./state";
import {
  assertCanAddEmployee,
  assertCanGenerate,
  canAddEmployee,
  employeeCap,
  isReadOnly,
  TierGateError,
  upgradeTargetFor,
} from "../tiers";

describe("subscription state machine", () => {
  it("trial → active → past_due → canceled", () => {
    expect(applySubscriptionFacts({ status: "trialing", tier: "launch" })).toEqual({ subscription_state: "trialing", tier: "launch" });
    expect(applySubscriptionFacts({ status: "active", tier: "launch" })).toEqual({ subscription_state: "active", tier: "launch" });
    expect(applySubscriptionFacts({ status: "past_due", tier: "launch" })).toEqual({ subscription_state: "past_due", tier: "launch" });
    expect(applySubscriptionFacts({ status: "canceled", tier: "launch" })).toEqual({ subscription_state: "canceled" });
  });

  it("unpaid / paused / incomplete_expired all lapse to canceled and never change tier", () => {
    for (const status of ["unpaid", "paused", "incomplete_expired"] as const) {
      expect(applySubscriptionFacts({ status, tier: "growth" })).toEqual({ subscription_state: "canceled" });
    }
  });

  it("resolves tiers from configured price ids", () => {
    const ids = { starter: "price_s", launch: "price_l", growth: "price_g" };
    expect(tierFromPriceId("price_l", ids)).toBe("launch");
    expect(tierFromPriceId("price_unknown", ids)).toBeNull();
    expect(tierFromPriceId(null, ids)).toBeNull();
  });
});

describe("employee caps (PRD §10: 3/5/15)", () => {
  it("caps are 3 / 5 / 15", () => {
    expect(employeeCap("starter")).toBe(3);
    expect(employeeCap("launch")).toBe(5);
    expect(employeeCap("growth")).toBe(15);
  });

  it("the 4th employee is blocked on Starter, with the upgrade path shown", () => {
    expect(canAddEmployee("starter", 2)).toBe(true);
    expect(canAddEmployee("starter", 3)).toBe(false);
    const active = { tier: "starter" as const, subscription_state: "active", trial_ends_at: null };
    expect(() => assertCanAddEmployee(active, 3)).toThrowError(TierGateError);
    try {
      assertCanAddEmployee(active, 3);
    } catch (e) {
      const err = e as TierGateError;
      expect(err.code).toBe("employee_cap");
      expect(err.upgradeTo).toBe("launch");
      expect(err.message).toContain("Upgrade to Launch");
    }
  });

  it("the 6th employee on Launch offers Growth; Growth's cap has no upgrade", () => {
    expect(upgradeTargetFor("launch")?.id).toBe("growth");
    expect(upgradeTargetFor("growth")).toBeNull();
  });
});

describe("lapse grace (read-only, documents downloadable)", () => {
  const NOW = new Date("2026-07-10T12:00:00Z");

  it("canceled → read-only; past_due keeps access (grace)", () => {
    expect(isReadOnly({ tier: "launch", subscription_state: "canceled", trial_ends_at: null }, NOW)).toBe(true);
    expect(isReadOnly({ tier: "launch", subscription_state: "past_due", trial_ends_at: null }, NOW)).toBe(false);
    expect(isReadOnly({ tier: "launch", subscription_state: "active", trial_ends_at: null }, NOW)).toBe(false);
  });

  it("an expired trial is read-only; a live trial is not", () => {
    expect(isReadOnly({ tier: "launch", subscription_state: "trialing", trial_ends_at: "2026-07-01T00:00:00Z" }, NOW)).toBe(true);
    expect(isReadOnly({ tier: "launch", subscription_state: "trialing", trial_ends_at: "2026-07-20T00:00:00Z" }, NOW)).toBe(false);
  });

  it("generation is gated on lapse — with document-access reassurance in the message", () => {
    const lapsed = { tier: "launch" as const, subscription_state: "canceled", trial_ends_at: null };
    try {
      assertCanGenerate(lapsed);
      expect.unreachable();
    } catch (e) {
      const err = e as TierGateError;
      expect(err.code).toBe("read_only");
      expect(err.message).toContain("still here to download");
    }
  });

  it("Starter is monitoring-only: generation gated even while active (PRD §10)", () => {
    const starter = { tier: "starter" as const, subscription_state: "active", trial_ends_at: null };
    try {
      assertCanGenerate(starter);
      expect.unreachable();
    } catch (e) {
      const err = e as TierGateError;
      expect(err.code).toBe("generation_tier");
      expect(err.upgradeTo).toBe("launch");
    }
  });
});
