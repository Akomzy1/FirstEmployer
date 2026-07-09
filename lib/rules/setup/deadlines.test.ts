import { describe, expect, it } from "vitest";
import { addDays, addMonths, addWorkingDays, pensionDeclarationDeadline } from "./deadlines";
import { isValidPayeReference } from "./validation";

/**
 * Deadline/date-math golden suite (CLAUDE.md testing gate 3).
 * The pension declaration deadline from a start date is the canonical fixture:
 * Liam's start 2026-08-03 → declaration due 2027-01-02.
 */
describe("pension declaration deadline (5 months from duties start, less one day)", () => {
  it("Liam: 2026-08-03 → 2027-01-02", () => {
    expect(pensionDeclarationDeadline("2026-08-03", 5)).toBe("2027-01-02");
  });
  it("TPR worked example: 2026-07-01 → 2026-11-30", () => {
    expect(pensionDeclarationDeadline("2026-07-01", 5)).toBe("2026-11-30");
  });
  it("mid-month: 2026-10-15 → 2027-03-14", () => {
    expect(pensionDeclarationDeadline("2026-10-15", 5)).toBe("2027-03-14");
  });
  it("is deterministic", () => {
    expect(pensionDeclarationDeadline("2026-08-03", 5)).toBe(pensionDeclarationDeadline("2026-08-03", 5));
  });
});

describe("addMonths clamps to month end", () => {
  it("31 Jan + 1 month → 28 Feb (non-leap)", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
  it("31 Jan + 1 month → 29 Feb (leap year 2028)", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });
  it("crosses year boundary", () => {
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });
});

describe("addDays / addWorkingDays", () => {
  it("addDays handles month + year rollover", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
  it("addWorkingDays skips weekends and lands on a weekday", () => {
    const r = addWorkingDays("2026-08-03", 5);
    const dow = new Date(`${r}T00:00:00Z`).getUTCDay();
    expect(dow).not.toBe(0);
    expect(dow).not.toBe(6);
    // 5 working days spans at least one weekend → ≥ 7 calendar days out.
    const days = (Date.parse(`${r}T00:00:00Z`) - Date.parse("2026-08-03T00:00:00Z")) / 86_400_000;
    expect(days).toBeGreaterThanOrEqual(7);
  });
});

describe("PAYE reference validation (NNN/XXNNNNN)", () => {
  it("accepts valid references", () => {
    expect(isValidPayeReference("123/AB456")).toBe(true);
    expect(isValidPayeReference("083/A12345")).toBe(true);
    expect(isValidPayeReference("120/XY9Z8")).toBe(true);
  });
  it("rejects malformed references", () => {
    expect(isValidPayeReference("12/AB456")).toBe(false); // only 2 tax-office digits
    expect(isValidPayeReference("1234/AB456")).toBe(false); // 4 digits
    expect(isValidPayeReference("123-AB456")).toBe(false); // wrong separator
    expect(isValidPayeReference("123/")).toBe(false); // no office ref
    expect(isValidPayeReference("ABC/AB456")).toBe(false); // non-numeric office
  });
});
