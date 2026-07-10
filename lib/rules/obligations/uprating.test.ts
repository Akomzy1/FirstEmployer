/**
 * The canonical uprating fixture (CLAUDE.md §6.4, J4): config 2026.1 → 2026.2.
 * A 21+ employee paid the OLD NLW (£12.21) must be flagged with a £0.50/hr gap
 * against the new £12.71 floor; Liam the apprentice at £8.00 stays legal.
 */
import { describe, expect, it } from "vitest";
import versionsData from "../../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../../config/types";
import { recheckPayAgainstConfig, type UpratingEmployeeInput } from "./uprating";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const cfg = (label: string): StatutoryConfig =>
  (VERSIONS.find((v) => v.label === label) as StatutoryConfigVersion).values;
const OLD = cfg("2026.1");
const NEW = cfg("2026.2");
const EFFECTIVE = "2026-04-01";

const LIAM: UpratingEmployeeInput = {
  id: "e-liam",
  fullName: "Liam Carter",
  roleLine: "Apprentice plumber",
  dob: "1999-05-14",
  isApprentice: true,
  apprenticeshipStart: "2026-08-03",
  hourlyRate: 8.0,
};
/** Seeded on 2026.1 at the then-legal NLW — the employee the uprating catches. */
const SAM: UpratingEmployeeInput = {
  id: "e-sam",
  fullName: "Sam Rai",
  roleLine: "Plumber · age 24",
  dob: "2002-01-15",
  isApprentice: false,
  hourlyRate: 12.21,
};

describe("canonical uprating fixture — 2026.1 → 2026.2", () => {
  it("Sam at £12.21 was legal under 2026.1", () => {
    const before = recheckPayAgainstConfig([SAM], OLD, "2026-03-31");
    expect(before.flagged).toHaveLength(0);
  });

  it("publishing 2026.2 flags Sam with a £0.50/hr gap against the £12.71 floor", () => {
    const after = recheckPayAgainstConfig([LIAM, SAM], NEW, EFFECTIVE);
    expect(after.checked).toBe(2);
    expect(after.flagged).toHaveLength(1);
    const sam = after.flagged[0];
    expect(sam.employeeId).toBe("e-sam");
    expect(sam.floor).toBe(12.71);
    expect(sam.gap).toBeCloseTo(0.5, 2);
    expect(sam.detail).toContain("50p/hour below the legal minimum of £12.71");
  });

  it("Liam the apprentice at £8.00 stays legal under 2026.2 (band-aware, not blanket NLW)", () => {
    const after = recheckPayAgainstConfig([LIAM], NEW, EFFECTIVE);
    expect(after.flagged).toHaveLength(0);
    expect(after.impacts[0].ok).toBe(true);
    expect(after.impacts[0].floor).toBe(8.0);
    expect(after.impacts[0].detail).toContain("Liam is fine");
  });

  it("skips employees without hourly pay data", () => {
    const r = recheckPayAgainstConfig([{ ...SAM, hourlyRate: null }], NEW, EFFECTIVE);
    expect(r.checked).toBe(0);
  });

  it("is deterministic", () => {
    const a = recheckPayAgainstConfig([LIAM, SAM], NEW, EFFECTIVE);
    const b = recheckPayAgainstConfig([LIAM, SAM], NEW, EFFECTIVE);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
