import { describe, expect, it } from "vitest";
import versionsData from "../../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../../config/types";
import { ageOn, checkPayFloor, deriveWageBand } from "./pay-floor";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const config = (label: string): StatutoryConfig => {
  const v = VERSIONS.find((x) => x.label === label);
  if (!v) throw new Error(`no config ${label}`);
  return v.values;
};
const C_2026_1 = config("2026.1"); // apprentice £7.55
const C_2026_2 = config("2026.2"); // apprentice £8.00

describe("ageOn", () => {
  it("counts whole years, birthday not yet reached", () => {
    expect(ageOn("1999-05-14", "2026-05-13")).toBe(26);
    expect(ageOn("1999-05-14", "2026-05-14")).toBe(27);
    expect(ageOn("2008-08-04", "2026-08-03")).toBe(17); // day before 18th birthday
  });
});

describe("deriveWageBand", () => {
  it("Liam Carter — 27 but a first-year apprentice → apprentice band (the gotcha)", () => {
    const r = deriveWageBand({
      dob: "1999-05-14",
      isApprentice: true,
      apprenticeshipStart: "2026-08-03",
      on: "2026-08-03",
    });
    expect(r.band).toBe("apprentice");
  });

  it("apprentice under 19 → apprentice band regardless of first-year", () => {
    expect(deriveWageBand({ dob: "2009-01-01", isApprentice: true, on: "2026-08-03" }).band).toBe("apprentice");
  });

  it("apprentice 19+ past the first year → moves to age band", () => {
    const r = deriveWageBand({
      dob: "1999-05-14",
      isApprentice: true,
      apprenticeshipStart: "2024-08-03", // first year ended 2025-08-03
      on: "2026-08-03",
    });
    expect(r.band).toBe("nlw_21_plus");
  });

  it("age bands for non-apprentices", () => {
    expect(deriveWageBand({ dob: "2005-01-01", on: "2026-08-03" }).band).toBe("nlw_21_plus"); // 21
    expect(deriveWageBand({ dob: "2007-01-01", on: "2026-08-03" }).band).toBe("nmw_18_20"); // 19
    expect(deriveWageBand({ dob: "2009-06-01", on: "2026-08-03" }).band).toBe("nmw_16_17"); // 17
  });

  it("unknown DOB stays safe: non-apprentice → NLW, apprentice → apprentice", () => {
    expect(deriveWageBand({ on: "2026-08-03" }).band).toBe("nlw_21_plus");
    expect(deriveWageBand({ isApprentice: true, on: "2026-08-03" }).band).toBe("apprentice");
  });
});

describe("checkPayFloor — Liam at £8.00 across the uprating", () => {
  const liam = { dob: "1999-05-14", isApprentice: true, apprenticeshipStart: "2026-08-03", on: "2026-08-03" };

  it("£8.00 passes on 2026.2 (apprentice floor £8.00)", () => {
    const r = checkPayFloor({ hourlyRate: 8.0, config: C_2026_2, band: liam });
    expect(r).toMatchObject({ ok: true, band: "apprentice", floor: 8.0, shortfall: 0 });
  });

  it("£8.00 comfortably clears the old 2026.1 apprentice floor (£7.55)", () => {
    const r = checkPayFloor({ hourlyRate: 8.0, config: C_2026_1, band: liam });
    expect(r).toMatchObject({ ok: true, floor: 7.55 });
  });

  it("a 1p shortfall fails (£7.99 under the £8.00 floor)", () => {
    const r = checkPayFloor({ hourlyRate: 7.99, config: C_2026_2, band: liam });
    expect(r.ok).toBe(false);
    expect(r.shortfall).toBeCloseTo(0.01, 2);
  });

  it("does NOT compare an apprentice against the 21+ NLW", () => {
    // £8.00 is below the £12.71 NLW but the apprentice band is correct → passes.
    const r = checkPayFloor({ hourlyRate: 8.0, config: C_2026_2, band: liam });
    expect(r.floor).not.toBe(C_2026_2.minimum_wage.nlw_21_plus);
    expect(r.ok).toBe(true);
  });

  it("a 21+ non-apprentice at £8.00 fails against the NLW", () => {
    const r = checkPayFloor({
      hourlyRate: 8.0,
      config: C_2026_2,
      band: { dob: "1990-01-01", on: "2026-08-03" },
    });
    expect(r).toMatchObject({ ok: false, band: "nlw_21_plus", floor: 12.71 });
  });
});
