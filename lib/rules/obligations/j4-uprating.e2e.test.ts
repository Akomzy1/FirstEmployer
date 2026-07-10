/**
 * J4 — the canonical uprating journey, end to end (CLAUDE.md §6.4, P0 acceptance).
 *
 *   Seeded business on 2026.1 with Sam at £12.21 (then-legal NLW)
 *   → 2026.2 goes live (NLW £12.71)
 *   → the re-check flags a £0.50/hr gap and the dashboard leaves green
 *   → a variation letter (consolidated statement at £12.71) is generated and
 *     examined by the REAL examiner (deterministic gate — no LLM, no network)
 *   → it passes, the minimum_wage obligation completes, the dashboard is green.
 *
 * Everything here is the production code path: pure rules + the real pipeline
 * with an in-memory store. Nothing is mocked except persistence.
 */
import { describe, expect, it } from "vitest";
import versionsData from "../../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../../config/types";
import type { ContractFacts, GeneratedContract } from "../../templates/contract/types";
import { renderVariationLetter } from "../../templates/contract/variation";
import { examineContract } from "../../ai/examiner-core";
import { runGeneration, type DocumentStore } from "../../documents/pipeline";
import { recheckPayAgainstConfig } from "./uprating";
import { deriveDashboard, type ObligationRowInput } from "./engine";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const cfg = (label: string): StatutoryConfig =>
  (VERSIONS.find((v) => v.label === label) as StatutoryConfigVersion).values;
const NEW = cfg("2026.2");
const EFFECTIVE = "2026-04-01";

/** Sam Rai — hired on 2026.1 terms at the old NLW. */
const SAM_FACTS: ContractFacts = {
  employerName: "DO Plumbing & Heating Ltd",
  employerType: "limited",
  employeeName: "Sam Rai",
  wageBand: { dob: "2002-01-15", isApprentice: false, on: EFFECTIVE },
  jobTitle: "Plumber",
  duties: "Domestic plumbing and heating installations, repairs and servicing.",
  place: "The yard in Walsall, plus customer sites.",
  hourlyRate: 12.21, // the stale, now-illegal rate
  weeklyHours: 40,
  payInterval: "Monthly",
  startDate: "2026-01-05",
  probation: "None",
  notice: "1 week",
  holidayDays: 28,
  daysPerWeek: 5,
  sickPay: "ssp",
  pension: "nest",
};

const baseObligations = (minWageState: ObligationRowInput["state"] | null): ObligationRowInput[] => [
  { type: "employment_status", state: "complete", due_date: null },
  { type: "hmrc_paye", state: "complete", due_date: null },
  { type: "payroll", state: "complete", due_date: null },
  { type: "pension_enrolment", state: "complete", due_date: null },
  { type: "pension_declaration", state: "complete", due_date: "2026-06-04" },
  { type: "el_insurance", state: "complete", due_date: "2027-01-05" },
  { type: "written_statement", state: "complete", due_date: null },
  { type: "right_to_work", state: "complete", due_date: null },
  { type: "record_keeping", state: "complete", due_date: null },
  ...(minWageState ? [{ type: "minimum_wage", state: minWageState, due_date: null } as ObligationRowInput] : []),
];

function memoryStore() {
  const state = { statuses: [] as string[], exams: [] as { verdict: string; attempt: number }[], events: [] as string[] };
  const store: DocumentStore = {
    async createDocument() { return { id: "doc-var-1", version: 1 }; },
    async setStatus(_id, s) { state.statuses.push(s); },
    async saveContent() { return "path/v1.json"; },
    async recordExamination({ result }) { state.exams.push({ verdict: result.verdict, attempt: result.attempt }); },
    async enqueueHumanReview() { /* not expected in this journey */ },
    async recordEvent({ action }) { state.events.push(action); },
  };
  return { store, state };
}

describe("J4 — 2026.1 → 2026.2 uprating, end to end", () => {
  it("runs the whole journey: flag → examined variation letter → green", async () => {
    // 1. Overnight re-check against the new config flags Sam's £0.50/hr gap.
    const recheck = recheckPayAgainstConfig(
      [{ id: "e-sam", fullName: "Sam Rai", dob: "2002-01-15", isApprentice: false, hourlyRate: 12.21 }],
      NEW,
      EFFECTIVE,
    );
    expect(recheck.flagged).toHaveLength(1);
    expect(recheck.flagged[0].gap).toBeCloseTo(0.5, 2);

    // 2. The flag lands as an at_risk minimum_wage obligation → dashboard leaves green.
    const flaggedDash = deriveDashboard({
      today: "2026-04-02",
      ownerFirstName: "Dave",
      hasDetermination: true,
      obligations: baseObligations("at_risk"),
    });
    expect(flaggedDash.tone).toBe("red");
    expect(flaggedDash.segments.find((s) => s.id === "contract")?.state).toBe("overdue");

    // 3. The variation letter — Sam's facts at the NEW rate — through the real
    //    pipeline, examined by the real examiner (deterministic gate).
    const newFacts: ContractFacts = { ...SAM_FACTS, hourlyRate: recheck.flagged[0].floor };
    const { store, state } = memoryStore();
    const result = await runGeneration({
      businessId: "biz-1",
      employeeId: "e-sam",
      facts: newFacts,
      config: NEW,
      configLabel: "2026.2",
      questionnaire: { reason: "uprating-2026.2" },
      documentType: "variation_letter",
      supersedes: "doc-contract-old",
      generate: async (f, c) =>
        renderVariationLetter(
          { facts: f, previousRate: 12.21, effectiveFrom: EFFECTIVE, reason: "The National Living Wage went up on 1 April, and the law says pay can never be below it." },
          c,
        ),
      examine: (input) => examineContract(input),
      store,
    });

    // 4. Examined and approved first pass — the new pay clause meets the new floor.
    expect(result.status).toBe("approved");
    expect(result.attempts).toBe(1);
    expect(state.exams).toEqual([{ verdict: "pass", attempt: 1 }]);
    expect(state.statuses).toEqual(["examining", "approved"]);
    const payCheck = result.examinations[0].checks.find((c) => c.id === 3);
    expect(payCheck?.status).toBe("pass");

    // The artefact really is a variation letter: covering clause + consolidated terms.
    const doc: GeneratedContract = result.contract;
    expect(doc.clauses[0].id).toBe("variation");
    expect(doc.clauses[0].body).toContain("£12.21");
    expect(doc.clauses[0].body).toContain("£12.71");

    // 5. On approval the obligation completes → the dashboard returns green.
    const greenDash = deriveDashboard({
      today: "2026-04-02",
      ownerFirstName: "Dave",
      hasDetermination: true,
      obligations: baseObligations("complete"),
    });
    expect(greenDash.tone).toBe("green");
    expect(greenDash.headline).toBe("You're compliant, Dave.");
  });

  it("fail closed: a variation letter still below the floor NEVER approves", async () => {
    // A buggy caller passes the old rate — the examiner must reject it twice
    // and route to human review, not deliver an illegal letter.
    const { store } = memoryStore();
    const result = await runGeneration({
      businessId: "biz-1",
      employeeId: "e-sam",
      facts: SAM_FACTS, // still £12.21
      config: NEW,
      configLabel: "2026.2",
      questionnaire: {},
      documentType: "variation_letter",
      generate: async (f, c) =>
        renderVariationLetter({ facts: f, previousRate: 12.21, effectiveFrom: EFFECTIVE, reason: "Uprating." }, c),
      examine: (input) => examineContract(input),
      store,
    });
    expect(result.status).toBe("human_review");
    expect(result.examinations.every((e) => e.verdict === "fail")).toBe(true);
    expect(result.examinations[0].checks.find((c) => c.id === 3)?.status).toBe("fail");
  });
});
