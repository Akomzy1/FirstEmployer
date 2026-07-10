/** P14 VERIFY: the diff view is correct for 2026.1 → 2026.2 (the canonical pair). */
import { describe, expect, it } from "vitest";
import versionsData from "../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../config/types";
import { diffConfigs } from "./config-diff";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const cfg = (l: string) => (VERSIONS.find((v) => v.label === l) as StatutoryConfigVersion).values as StatutoryConfig;

describe("diffConfigs — 2026.1 → 2026.2", () => {
  const rows = diffConfigs(cfg("2026.1"), cfg("2026.2"));
  const changed = rows.filter((r) => r.changed);

  it("flags exactly the April uprating changes (four wage bands + SSP day-one)", () => {
    expect(changed.map((r) => r.path).sort()).toEqual([
      "minimum_wage.apprentice",
      "minimum_wage.nlw_21_plus",
      "minimum_wage.nmw_16_17",
      "minimum_wage.nmw_18_20",
      "ssp.day_one",
    ]);
  });

  it("renders the canonical NLW change £12.21 → £12.71", () => {
    const nlw = changed.find((r) => r.path === "minimum_wage.nlw_21_plus")!;
    expect(nlw.from).toBe("£12.21");
    expect(nlw.to).toBe("£12.71");
    expect(nlw.key).toBe("National Living Wage (21+)");
  });

  it("unchanged statutory values diff as unchanged (trigger, penalties, NI)", () => {
    for (const path of ["pension.ae_earnings_trigger", "right_to_work.penalty_first_breach", "ni.employment_allowance"]) {
      const row = rows.find((r) => r.path === path)!;
      expect(row.changed).toBe(false);
      expect(row.from).toBe(row.to);
    }
  });

  it("changed keys sort first", () => {
    expect(rows.slice(0, changed.length).every((r) => r.changed)).toBe(true);
  });
});
