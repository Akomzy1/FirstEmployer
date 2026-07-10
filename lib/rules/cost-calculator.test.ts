import { describe, expect, it } from "vitest";
import versionsData from "../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../config/types";
import { calculateHiringCost } from "./cost-calculator";

const C = ((versionsData as { versions: StatutoryConfigVersion[] }).versions.find((v) => v.label === "2026.2") as StatutoryConfigVersion).values as StatutoryConfig;

describe("cost calculator (pure over config)", () => {
  it("Liam the apprentice: £8.00 × 40h — NI fully covered by the Employment Allowance", () => {
    const r = calculateHiringCost(
      { hourlyRate: 8, hoursPerWeek: 40, band: { dob: "1999-05-14", isApprentice: true, apprenticeshipStart: "2026-08-03", on: "2026-08-03" } },
      C,
    );
    expect(r.grossAnnual).toBe(16640); // 8 × 40 × 52
    // NI: (16640 − 5000) × 15% = 1746; allowance 10500 covers it entirely.
    expect(r.employerNiBeforeAllowance).toBe(1746);
    expect(r.employerNiAfterAllowance).toBe(0);
    // Pension: gross ≥ trigger (10000); qualifying = 16640 − 6240 = 10400 × 3% = 312.
    expect(r.pensionEmployerAnnual).toBe(312);
    expect(r.totalAnnual).toBe(16640 + 0 + 312);
    expect(r.payFloorOk).toBe(true);
  });

  it("below the AE trigger there is no employer pension line", () => {
    const r = calculateHiringCost({ hourlyRate: 12.71, hoursPerWeek: 14, band: { dob: "1990-01-01", on: "2026-08-03" } }, C);
    expect(r.grossAnnual).toBeLessThan(C.pension.ae_earnings_trigger);
    expect(r.pensionEmployerAnnual).toBe(0);
  });

  it("flags a wage below the band floor", () => {
    const r = calculateHiringCost({ hourlyRate: 9, hoursPerWeek: 40, band: { dob: "1990-01-01", on: "2026-08-03" } }, C);
    expect(r.payFloorOk).toBe(false);
    expect(r.payFloor).toBe(C.minimum_wage.nlw_21_plus);
  });

  it("is deterministic", () => {
    const input = { hourlyRate: 13, hoursPerWeek: 37.5, band: { dob: "1995-06-01", on: "2026-08-03" } };
    expect(calculateHiringCost(input, C)).toEqual(calculateHiringCost(input, C));
  });
});
