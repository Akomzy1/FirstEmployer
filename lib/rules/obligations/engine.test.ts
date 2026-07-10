import { describe, expect, it } from "vitest";
import { deriveDashboard, type DashboardSnapshot, type ObligationRowInput } from "./engine";

const TODAY = "2026-07-04"; // the prototype's fixed demo date

function row(type: string, state: ObligationRowInput["state"], due: string | null = null): ObligationRowInput {
  return { type, state, due_date: due };
}

/** All eight segments met — the prototype's "All green" scenario. */
const ALL_GREEN: ObligationRowInput[] = [
  row("employment_status", "complete"),
  row("hmrc_paye", "complete"),
  row("payroll", "complete"),
  row("pension_enrolment", "complete"),
  row("pension_declaration", "complete", "2026-11-14"),
  row("el_insurance", "complete", "2027-06-02"),
  row("written_statement", "complete"),
  row("right_to_work", "complete"),
  row("record_keeping", "complete"),
];

function snap(obligations: ObligationRowInput[], hasDetermination = true): DashboardSnapshot {
  return { today: TODAY, ownerFirstName: "Dave", hasDetermination, obligations };
}

describe("deriveDashboard — the three prototype states", () => {
  it("all green: 8/8 met, green tone, 'You're compliant, Dave.'", () => {
    const d = deriveDashboard(snap(ALL_GREEN));
    expect(d.metCount).toBe(8);
    expect(d.tone).toBe("green");
    expect(d.headline).toBe("You're compliant, Dave.");
    expect(d.centre).toEqual({ big: "8", small: "of 8 met" });
    expect(d.segments.every((s) => s.state === "verified")).toBe(true);
  });

  it("attention: open items, none overdue → amber, 'N items need attention'", () => {
    const obligations = ALL_GREEN.map((r) =>
      r.type === "pension_declaration" ? row("pension_declaration", "not_started", "2026-07-25")
        : r.type === "record_keeping" ? row("record_keeping", "in_progress") : r,
    );
    const d = deriveDashboard(snap(obligations));
    expect(d.tone).toBe("amber");
    expect(d.metCount).toBe(6);
    expect(d.headline).toBe("2 items need attention");
    expect(d.subline).toMatch(/^Nothing is overdue\./);
    expect(d.centre).toEqual({ big: "6", small: "of 8 · 2 to do" });
    expect(d.segments.find((s) => s.id === "pension")?.state).toBe("attention");
    expect(d.segments.find((s) => s.id === "pension")?.deadline?.grade).toBe("approaching");
  });

  it("at risk: a past-due obligation → red, 'N item is overdue' with days count", () => {
    const obligations = ALL_GREEN.map((r) =>
      r.type === "right_to_work" ? row("right_to_work", "in_progress", "2026-06-29") : r,
    );
    const d = deriveDashboard(snap(obligations));
    expect(d.tone).toBe("red");
    expect(d.headline).toBe("1 item is overdue");
    expect(d.subline).toBe("Right to work is 5 days overdue. Let's sort it now — it only takes a minute.");
    expect(d.centre).toEqual({ big: "7", small: "of 8 · 1 overdue" });
    expect(d.segments.find((s) => s.id === "rtw")?.state).toBe("overdue");
  });
});

describe("deriveDashboard — mechanics", () => {
  it("is deterministic: identical snapshots produce identical output", () => {
    const a = deriveDashboard(snap(ALL_GREEN));
    const b = deriveDashboard(snap(ALL_GREEN));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("a fresh business (no rows, no determination) is all pending → amber", () => {
    const d = deriveDashboard(snap([], false));
    expect(d.metCount).toBe(0);
    expect(d.tone).toBe("amber");
    expect(d.segments.every((s) => s.state === "pending")).toBe(true);
  });

  it("an at_risk minimum_wage row turns the CONTRACT segment red (J4 wiring)", () => {
    const obligations = [...ALL_GREEN, row("minimum_wage", "at_risk")];
    const d = deriveDashboard(snap(obligations));
    expect(d.segments.find((s) => s.id === "contract")?.state).toBe("overdue");
    expect(d.tone).toBe("red");
  });

  it("pension segment combines enrolment + declaration; declaration deadline is first-class", () => {
    const obligations = ALL_GREEN.map((r) =>
      r.type === "pension_declaration" ? row("pension_declaration", "not_started", "2027-01-02") : r,
    );
    const d = deriveDashboard(snap(obligations));
    const pension = d.segments.find((s) => s.id === "pension")!;
    expect(pension.state).toBe("attention");
    expect(pension.dueDate).toBe("2027-01-02");
  });

  it("timeline includes only open, dated rows within 90 days, earliest first", () => {
    const obligations = [
      row("pension_declaration", "not_started", "2026-07-25"), // 21 days
      row("el_insurance", "complete", "2026-08-01"), // complete → excluded
      row("right_to_work", "in_progress", "2026-12-01"), // >90 days → excluded
      row("payroll", "in_progress", "2026-07-10"), // 6 days
    ];
    const d = deriveDashboard(snap(obligations));
    expect(d.timeline.map((t) => t.date)).toEqual(["2026-07-10", "2026-07-25"]);
    expect(d.timeline[0].grade).toBe("urgent");
    expect(d.timeline[0].frac).toBeCloseTo(6 / 90, 5);
  });

  it("green subline names the next deadline (a met item's future date counts)", () => {
    const d = deriveDashboard(snap(ALL_GREEN));
    expect(d.subline).toBe("All 8 obligations met. Next deadline: pension declaration, 14 Nov.");
  });
});
