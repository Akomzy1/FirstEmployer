import { describe, expect, it } from "vitest";
import { determineStatus, RULES_VERSION } from "./engine";
import { QUESTIONS } from "./questions";
import type { Confidence, Verdict } from "./types";

/**
 * Status Advisor golden suite (CLAUDE.md testing gate 1: 40 cases, 40/40).
 * Answers are given positionally in question order; `a(...)` maps them to ids.
 * Each verdict/confidence is pinned to RULES_VERSION — changing an expected
 * value without bumping the version is the failure this gate exists to catch.
 */
const ORDER = QUESTIONS.map((q) => q.id);
function a(...vals: string[]): Record<string, string> {
  if (vals.length !== ORDER.length) throw new Error(`expected ${ORDER.length} answers, got ${vals.length}`);
  return Object.fromEntries(ORDER.map((id, i) => [id, vals[i]]));
}

interface Case {
  id: string;
  v: Verdict;
  c: Confidence;
  answers: Record<string, string>;
}

// order: substitution, control_place, control_how, moo_ongoing, moo_refuse,
//        equipment, risk, integration, exclusivity, pay, benefits, own_business
const CASES: Case[] = [
  // ---- clear employees ----
  { id: "emp-textbook", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "emp-liam-apprentice", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "emp-one-neutral-excl", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "you", "fixed", "team", "mainly", "wage", "yes", "no") },
  { id: "emp-neutral-ownbiz", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "wage", "yes", "some") },
  { id: "emp-control-how-agreed", v: "employee", c: "clear", answers: a("himself", "yes", "agreed", "ongoing", "must", "you", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "emp-soft-pay-benefits", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "mix", "some", "no") },
  { id: "emp-refuse-usually", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "usually", "you", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "emp-equipment-mix", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "mix", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "emp-part-time", v: "employee", c: "clear", answers: a("himself", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "wage", "some", "no") },

  // ---- leaning employees (some business-on-own-account signals, gateway still met) ----
  { id: "lean-emp-3self", v: "employee", c: "leaning", answers: a("himself", "yes", "you", "ongoing", "must", "them", "profitloss", "team", "others", "wage", "yes", "no") },
  { id: "lean-emp-ownbiz", v: "employee", c: "leaning", answers: a("himself", "yes", "you", "ongoing", "must", "them", "profitloss", "team", "only", "wage", "yes", "yes") },
  { id: "lean-emp-4self", v: "employee", c: "leaning", answers: a("himself", "yes", "you", "ongoing", "must", "them", "profitloss", "separate", "only", "invoice", "yes", "no") },
  { id: "lean-emp-depends", v: "employee", c: "leaning", answers: a("depends", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "wage", "yes", "no") },

  // ---- clear self-employed ----
  { id: "self-textbook", v: "self_employed", c: "clear", answers: a("sub", "no", "them", "oneoff", "refuse", "them", "profitloss", "separate", "others", "invoice", "no", "yes") },
  { id: "self-sub-integration", v: "self_employed", c: "clear", answers: a("sub", "no", "them", "oneoff", "refuse", "them", "profitloss", "some", "others", "invoice", "no", "yes") },
  { id: "self-sub-varies", v: "self_employed", c: "clear", answers: a("sub", "varies", "them", "when", "refuse", "them", "profitloss", "separate", "others", "invoice", "some", "yes") },
  { id: "self-sub-paymix", v: "self_employed", c: "clear", answers: a("sub", "no", "them", "oneoff", "refuse", "them", "profitloss", "separate", "others", "mix", "no", "yes") },
  { id: "self-sub-mainly", v: "self_employed", c: "clear", answers: a("sub", "no", "them", "oneoff", "refuse", "them", "profitloss", "separate", "mainly", "invoice", "no", "yes") },
  { id: "self-sub-two-emp-support", v: "self_employed", c: "clear", answers: a("sub", "no", "them", "oneoff", "refuse", "you", "fixed", "separate", "others", "invoice", "no", "yes") },
  { id: "self-sub-all-neutral", v: "self_employed", c: "clear", answers: a("sub", "varies", "agreed", "when", "usually", "mix", "some", "some", "mainly", "mix", "some", "some") },
  { id: "self-sub-control-agreed", v: "self_employed", c: "clear", answers: a("sub", "no", "agreed", "oneoff", "refuse", "them", "profitloss", "separate", "others", "invoice", "no", "yes") },

  // ---- leaning self-employed (personal service present, but business-on-own-account) ----
  { id: "lean-self-himself", v: "self_employed", c: "leaning", answers: a("himself", "no", "them", "oneoff", "refuse", "them", "profitloss", "separate", "others", "invoice", "no", "yes") },
  { id: "lean-self-himself2", v: "self_employed", c: "leaning", answers: a("himself", "varies", "agreed", "oneoff", "refuse", "them", "profitloss", "separate", "others", "invoice", "no", "yes") },
  { id: "lean-self-himself3", v: "self_employed", c: "leaning", answers: a("himself", "no", "them", "when", "refuse", "them", "profitloss", "some", "others", "invoice", "no", "yes") },

  // ---- workers (personal service, but gateway not met; not in business) ----
  { id: "worker-all-neutral", v: "worker", c: "leaning", answers: a("himself", "varies", "agreed", "when", "usually", "mix", "some", "some", "mainly", "mix", "some", "some") },
  { id: "worker-emp-support-no-core", v: "worker", c: "leaning", answers: a("himself", "varies", "agreed", "when", "usually", "you", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "worker-control-no-moo", v: "worker", c: "leaning", answers: a("himself", "yes", "you", "when", "usually", "mix", "some", "some", "mainly", "mix", "some", "some") },
  { id: "worker-moo-no-control", v: "worker", c: "leaning", answers: a("himself", "varies", "agreed", "ongoing", "must", "mix", "some", "some", "mainly", "mix", "some", "some") },
  { id: "worker-depends-control-no-moo", v: "worker", c: "leaning", answers: a("depends", "yes", "you", "when", "usually", "mix", "some", "team", "only", "wage", "yes", "no") },
  { id: "worker-control-leans-self", v: "worker", c: "leaning", answers: a("himself", "varies", "them", "when", "usually", "them", "profitloss", "some", "mainly", "mix", "some", "some") },
  { id: "worker-mixed-support", v: "worker", c: "leaning", answers: a("himself", "yes", "agreed", "when", "refuse", "you", "fixed", "team", "only", "wage", "some", "no") },
  { id: "worker-casual-zero-hours", v: "worker", c: "leaning", answers: a("himself", "yes", "you", "when", "refuse", "you", "fixed", "team", "only", "wage", "no", "no") },

  // ---- ambiguous edge cases ----
  { id: "amb-rmc-employee-core-business-signals", v: "employee", c: "ambiguous", answers: a("himself", "yes", "you", "ongoing", "must", "them", "profitloss", "separate", "others", "wage", "no", "some") },
  { id: "amb-sub-but-otherwise-employee", v: "self_employed", c: "ambiguous", answers: a("sub", "yes", "you", "ongoing", "must", "you", "fixed", "team", "only", "wage", "yes", "no") },
  { id: "amb-worker-both-ways", v: "worker", c: "ambiguous", answers: a("himself", "yes", "them", "ongoing", "refuse", "them", "profitloss", "some", "mainly", "mix", "no", "some") },
  { id: "amb-self-strong-control", v: "self_employed", c: "ambiguous", answers: a("himself", "yes", "you", "when", "refuse", "them", "profitloss", "team", "others", "wage", "no", "yes") },
  { id: "amb-depends-balanced-self", v: "self_employed", c: "ambiguous", answers: a("depends", "yes", "you", "ongoing", "usually", "them", "profitloss", "team", "others", "wage", "no", "yes") },
  { id: "amb-employee-edge-support6", v: "employee", c: "ambiguous", answers: a("himself", "yes", "agreed", "ongoing", "usually", "them", "profitloss", "separate", "others", "mix", "no", "yes") },
  { id: "amb-sub-strong-employee-core", v: "self_employed", c: "ambiguous", answers: a("sub", "yes", "you", "ongoing", "must", "you", "fixed", "team", "some", "wage", "some", "no") },

  // ---- extra coverage ----
  { id: "extra-freelance-clear-self", v: "self_employed", c: "clear", answers: a("sub", "varies", "them", "when", "refuse", "them", "profitloss", "separate", "others", "invoice", "no", "some") },
];

describe("Status Advisor golden suite (40 cases)", () => {
  it("has at least 40 cases", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(40);
  });

  for (const c of CASES) {
    it(`${c.id} → ${c.v}/${c.c}`, () => {
      const d = determineStatus(c.answers, "Liam");
      expect(`${d.verdict}/${d.confidence}`).toBe(`${c.v}/${c.c}`);
      expect(d.rules_version).toBe(RULES_VERSION);
    });
  }

  it("is deterministic — identical answers give a byte-identical payload", () => {
    const ans = CASES[0].answers;
    expect(JSON.stringify(determineStatus(ans, "Liam"))).toBe(JSON.stringify(determineStatus(ans, "Liam")));
  });

  it("verdict/confidence never depend on the person's name", () => {
    const ans = CASES[0].answers;
    const x = determineStatus(ans, "Liam");
    const y = determineStatus(ans, "Priya");
    expect([x.verdict, x.confidence]).toEqual([y.verdict, y.confidence]);
  });

  it("covers all three verdicts and all three confidence bands", () => {
    const verdicts = new Set(CASES.map((c) => c.v));
    const confidences = new Set(CASES.map((c) => c.c));
    expect(verdicts).toEqual(new Set(["employee", "worker", "self_employed"]));
    expect(confidences).toEqual(new Set(["clear", "leaning", "ambiguous"]));
  });
});
