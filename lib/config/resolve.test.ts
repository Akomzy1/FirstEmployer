import { describe, expect, it } from "vitest";
import versionsData from "./versions.json";
import { resolveConfigVersion, toIsoDate } from "./resolve";
import type { StatutoryConfigVersion } from "./types";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;

/**
 * Config resolver golden suite (Prompt 2 VERIFY + CLAUDE.md testing gate 5).
 * The canonical assertion: 2026-03-31 resolves to 2026.1; 2026-04-01 to 2026.2.
 * These verdicts are deterministic and must not change without a config bump.
 */
describe("config resolver goldens", () => {
  it("resolves 2026-03-31 to the 2026.1 (superseded) version", () => {
    const v = resolveConfigVersion(VERSIONS, "2026-03-31");
    expect(v?.label).toBe("2026.1");
    expect(v?.values.minimum_wage.nlw_21_plus).toBe(12.21);
    expect(v?.values.minimum_wage.apprentice).toBe(7.55);
    expect(v?.values.ssp.day_one).toBe(false);
  });

  it("resolves 2026-04-01 (the uprating boundary) to 2026.2", () => {
    const v = resolveConfigVersion(VERSIONS, "2026-04-01");
    expect(v?.label).toBe("2026.2");
    expect(v?.values.minimum_wage.nlw_21_plus).toBe(12.71);
    expect(v?.values.minimum_wage.apprentice).toBe(8.0);
    expect(v?.values.ssp.day_one).toBe(true);
  });

  it("stays on 2026.1 the instant before the boundary and 2026.2 well after", () => {
    expect(resolveConfigVersion(VERSIONS, "2025-04-01")?.label).toBe("2026.1");
    expect(resolveConfigVersion(VERSIONS, "2026-03-31")?.label).toBe("2026.1");
    expect(resolveConfigVersion(VERSIONS, "2026-04-02")?.label).toBe("2026.2");
    expect(resolveConfigVersion(VERSIONS, "2027-01-01")?.label).toBe("2026.2");
  });

  it("accepts Date objects and full ISO timestamps identically", () => {
    expect(resolveConfigVersion(VERSIONS, new Date("2026-03-31T23:59:59Z"))?.label).toBe("2026.1");
    expect(resolveConfigVersion(VERSIONS, "2026-04-01T00:00:00Z")?.label).toBe("2026.2");
  });

  it("returns null before any version is in effect", () => {
    expect(resolveConfigVersion(VERSIONS, "2024-01-01")).toBeNull();
  });

  it("ignores draft versions when resolving", () => {
    const withDraft: StatutoryConfigVersion[] = [
      ...VERSIONS,
      {
        label: "2027.1-draft",
        effective_from: "2026-06-01",
        status: "draft",
        values: VERSIONS[1].values,
      },
    ];
    // A draft effective before 'now' must never be picked.
    expect(resolveConfigVersion(withDraft, "2026-12-01")?.label).toBe("2026.2");
  });

  it("normalises dates to YYYY-MM-DD", () => {
    expect(toIsoDate("2026-04-01T12:34:56Z")).toBe("2026-04-01");
    expect(toIsoDate(new Date("2026-04-01T00:00:00Z"))).toBe("2026-04-01");
  });
});
