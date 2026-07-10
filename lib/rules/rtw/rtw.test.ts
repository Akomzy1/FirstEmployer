import { describe, expect, it } from "vitest";
import { determineRtwRoute, toRtwResult } from "./route";
import { addDays, requiresFollowUp, rtwFollowUpSchedule, RTW_ALERT_OFFSETS_DAYS } from "./schedule";

describe("determineRtwRoute", () => {
  it("British/Irish passport → manual", () => {
    expect(determineRtwRoute("passport_british_irish").route).toBe("manual");
  });
  it("eVisa/BRP/share code → share_code", () => {
    expect(determineRtwRoute("share_code_evisa_brp").route).toBe("share_code");
  });
  it("outstanding application / unclear → employer_checking_service", () => {
    expect(determineRtwRoute("outstanding_or_other").route).toBe("employer_checking_service");
  });
  it("is deterministic — same choice, same route + basis", () => {
    expect(determineRtwRoute("share_code_evisa_brp")).toEqual(determineRtwRoute("share_code_evisa_brp"));
  });
});

describe("toRtwResult", () => {
  it("maps result choices to the immutable rtw_result enum", () => {
    expect(toRtwResult("continuous")).toBe("pass");
    expect(toRtwResult("time_limited")).toBe("follow_up_required");
    expect(toRtwResult("not_permitted")).toBe("fail");
  });
});

describe("addDays", () => {
  it("subtracts across month boundaries in UTC", () => {
    expect(addDays("2026-09-30", -7)).toBe("2026-09-23");
    expect(addDays("2026-09-30", -30)).toBe("2026-08-31");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("rtwFollowUpSchedule — 90/30/7 (PRD FR-4.4)", () => {
  it("uses the 90/30/7 offsets, not 60/30/7", () => {
    expect([...RTW_ALERT_OFFSETS_DAYS]).toEqual([90, 30, 7]);
  });

  it("Aisha fixture: expiry 30 Sep 2026 → follow-up due + three alerts (golden)", () => {
    const s = rtwFollowUpSchedule("2026-09-30");
    expect(s.followUpDue).toBe("2026-09-30");
    expect(s.alerts).toEqual([
      { daysBefore: 90, date: "2026-07-02" },
      { daysBefore: 30, date: "2026-08-31" },
      { daysBefore: 7, date: "2026-09-23" },
    ]);
  });

  it("alerts are ordered earliest-first", () => {
    const dates = rtwFollowUpSchedule("2027-03-15").alerts.map((a) => a.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("requiresFollowUp only for time-limited (follow_up_required)", () => {
    expect(requiresFollowUp("follow_up_required")).toBe(true);
    expect(requiresFollowUp("pass")).toBe(false);
    expect(requiresFollowUp("fail")).toBe(false);
  });
});
