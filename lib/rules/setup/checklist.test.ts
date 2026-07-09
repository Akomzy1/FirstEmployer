import { describe, expect, it } from "vitest";
import {
  deriveChecklistStates,
  instantiateChecklist,
  setupProgress,
  type StepState,
} from "./checklist";

describe("checklist instantiation differs by business type (FR-2.1)", () => {
  const limited = instantiateChecklist("limited");
  const sole = instantiateChecklist("sole_trader");

  it("both types share the same ordered step set", () => {
    expect(limited.map((s) => s.id)).toEqual(sole.map((s) => s.id));
  });

  it("HMRC guidance differs between limited and sole trader", () => {
    const l = limited.find((s) => s.id === "hmrc_paye")!;
    const s = sole.find((x) => x.id === "hmrc_paye")!;
    expect(l.guidance).not.toBe(s.guidance);
    expect(l.guidance).toContain("company registration number");
    expect(s.guidance).toContain("Self Assessment");
  });

  it("director consideration is set only for the limited company", () => {
    expect(limited.find((s) => s.id === "hmrc_paye")!.directorConsideration).toBe(true);
    expect(sole.find((s) => s.id === "hmrc_paye")!.directorConsideration).toBe(false);
    expect(limited.find((s) => s.id === "pension")!.directorConsideration).toBe(true);
    expect(sole.find((s) => s.id === "pension")!.directorConsideration).toBe(false);
  });

  it("pension guidance differs (director auto-enrolment for limited)", () => {
    expect(limited.find((s) => s.id === "pension")!.guidance).not.toBe(
      sole.find((s) => s.id === "pension")!.guidance,
    );
  });
});

describe("dependency gating (FR-2.6)", () => {
  const steps = instantiateChecklist("limited");

  it("payroll is blocked until HMRC is at least in progress", () => {
    const s0 = deriveChecklistStates(steps, {});
    expect(s0.payroll).toBe("blocked");
    const s1 = deriveChecklistStates(steps, { hmrc_paye: "in_progress" });
    expect(s1.payroll).toBe("not_started");
  });

  it("contract is blocked until pension is complete", () => {
    const inProg = deriveChecklistStates(steps, { pension: "in_progress" });
    expect(inProg.contract).toBe("blocked");
    const done = deriveChecklistStates(steps, { pension: "complete" });
    expect(done.contract).toBe("not_started");
  });

  it("records a step's own state when its dependency is satisfied", () => {
    const states: Record<string, StepState> = { hmrc_paye: "complete", payroll: "complete" };
    expect(deriveChecklistStates(steps, states).payroll).toBe("complete");
  });

  it("progress counts completed setup-owned steps", () => {
    const states = deriveChecklistStates(steps, { hmrc_paye: "complete", payroll: "complete", el_insurance: "complete" });
    const p = setupProgress(steps, states);
    expect(p.done).toBe(3);
    expect(p.total).toBe(6); // hmrc, payroll, pension, insurance, ico, h&s
  });
});
