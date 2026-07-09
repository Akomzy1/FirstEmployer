import { describe, expect, it } from "vitest";
import versionsData from "../../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../../config/types";
import { checkHolidayFloor, holidayFloorDays } from "./holiday";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const C = (VERSIONS.find((v) => v.label === "2026.2") as StatutoryConfigVersion).values as StatutoryConfig;

describe("holidayFloorDays", () => {
  it("full-time (5-day week or unspecified) is 28 days — 5.6 weeks from config", () => {
    expect(holidayFloorDays(C)).toBe(28);
    expect(holidayFloorDays(C, 5)).toBe(28);
  });

  it("more than 5 days a week is capped at the full-time entitlement", () => {
    expect(holidayFloorDays(C, 6)).toBe(28);
  });

  it("part-time is pro-rated (3 days a week → 17 days)", () => {
    expect(holidayFloorDays(C, 3)).toBe(Math.round(5.6 * 3)); // 17
  });
});

describe("checkHolidayFloor", () => {
  it("28 days full-time passes", () => {
    expect(checkHolidayFloor(C, 28)).toMatchObject({ ok: true, floor: 28, shortfall: 0 });
  });
  it("27 days full-time fails by one day", () => {
    expect(checkHolidayFloor(C, 27)).toMatchObject({ ok: false, floor: 28, shortfall: 1 });
  });
});
