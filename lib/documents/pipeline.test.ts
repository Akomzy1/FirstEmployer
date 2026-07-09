import { describe, expect, it } from "vitest";
import versionsData from "../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../config/types";
import type { ContractFacts, GeneratedContract } from "../templates/contract/types";
import { renderContractFromTemplates } from "../templates/contract/render";
import { makeStubExaminer, type ExaminerDirective } from "../ai/examiner-stub";
import { runGeneration, type DocumentStore, type RunGenerationResult } from "./pipeline";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const CONFIG = (VERSIONS.find((v) => v.label === "2026.2") as StatutoryConfigVersion).values as StatutoryConfig;

/** Liam Carter — the canonical fixture: apprentice, £8.00/hr, 40 hrs, start 3 Aug 2026. */
const LIAM: ContractFacts = {
  employerName: "DO Plumbing & Heating Ltd",
  employerType: "limited",
  employeeName: "Liam Carter",
  wageBand: { dob: "1999-05-14", isApprentice: true, apprenticeshipStart: "2026-08-03", on: "2026-08-03" },
  jobTitle: "Apprentice plumber",
  duties: "Assisting on domestic heating and plumbing jobs under supervision.",
  place: "Various customer sites across Walsall, reporting to the yard.",
  hourlyRate: 8.0,
  weeklyHours: 40,
  payInterval: "Monthly",
  startDate: "2026-08-03",
  probation: "3 months",
  notice: "1 week",
  holidayDays: 28,
  daysPerWeek: 5,
  sickPay: "ssp",
  pension: "nest",
};

/** In-memory store — records every side effect for assertions. */
function makeMemoryStore() {
  const state = {
    statuses: [] as string[],
    examinations: [] as { attempt: number; verdict: string; hash: string }[],
    humanReview: null as null | { defects: unknown[] },
    events: [] as string[],
    content: [] as GeneratedContract[],
  };
  let seq = 0;
  const store: DocumentStore = {
    async createDocument() {
      return { id: `doc-${++seq}`, version: 1 };
    },
    async setStatus(_id, status) {
      state.statuses.push(status);
    },
    async saveContent(_id, _v, contract) {
      state.content.push(contract);
      return `path/${state.content.length}.json`;
    },
    async recordExamination({ result }) {
      state.examinations.push({ attempt: result.attempt, verdict: result.verdict, hash: result.checklistHash });
    },
    async enqueueHumanReview({ defects }) {
      state.humanReview = { defects };
    },
    async recordEvent({ action }) {
      state.events.push(action);
    },
  };
  return { store, state };
}

function run(directive: ExaminerDirective, facts = LIAM): Promise<RunGenerationResult> {
  const { store, state } = makeMemoryStore();
  return runGeneration({
    businessId: "biz-1",
    employeeId: "emp-1",
    facts,
    config: CONFIG,
    configLabel: "2026.2",
    questionnaire: { jobTitle: facts.jobTitle },
    generate: async (f, c) => renderContractFromTemplates(f, c),
    examine: makeStubExaminer(directive),
    store,
  }).then((r) => Object.assign(r, { __state: state })) as Promise<RunGenerationResult>;
}

describe("generation pipeline — the three prototype paths", () => {
  it("first pass: approves on attempt 1, writes one PASS examination", async () => {
    const r = (await run("approve")) as RunGenerationResult & { __state: ReturnType<typeof makeMemoryStore>["state"] };
    expect(r.status).toBe("approved");
    expect(r.outcome).toBe("approve");
    expect(r.attempts).toBe(1);
    expect(r.__state.statuses).toEqual(["examining", "approved"]);
    expect(r.__state.examinations).toEqual([{ attempt: 1, verdict: "pass", hash: r.examinations[0].checklistHash }]);
    expect(r.__state.events).toContain("document.approved");
    expect(r.__state.humanReview).toBeNull();
  });

  it("fix then pass: fails attempt 1, revises, approves attempt 2", async () => {
    const r = (await run("fix")) as RunGenerationResult & { __state: ReturnType<typeof makeMemoryStore>["state"] };
    expect(r.status).toBe("approved");
    expect(r.outcome).toBe("fix");
    expect(r.attempts).toBe(2);
    expect(r.examinations.map((e) => e.verdict)).toEqual(["fail", "pass"]);
    expect(r.__state.examinations).toHaveLength(2); // both attempts recorded, immutably
    expect(r.__state.statuses).toEqual(["examining", "approved"]);
    expect(r.__state.humanReview).toBeNull();
  });

  it("needs human: fails both attempts → human_review, queued, nothing delivered", async () => {
    const r = (await run("human")) as RunGenerationResult & { __state: ReturnType<typeof makeMemoryStore>["state"] };
    expect(r.status).toBe("human_review");
    expect(r.outcome).toBe("human");
    expect(r.attempts).toBe(2);
    expect(r.examinations.every((e) => e.verdict === "fail")).toBe(true);
    expect(r.__state.statuses).toEqual(["examining", "human_review"]);
    expect(r.__state.humanReview).not.toBeNull();
    expect(r.__state.events).toContain("document.human_review");
    // fail closed: never an "approved" event
    expect(r.__state.events).not.toContain("document.approved");
  });

  it("fail closed on real defects: an under-floor rate never approves, even with 'approve' directive", async () => {
    const underpaid = { ...LIAM, hourlyRate: 7.99 };
    const r = (await run("approve", underpaid)) as RunGenerationResult;
    expect(r.status).toBe("human_review");
    expect(r.examinations[0].checks.find((c) => c.id === 3)?.status).toBe("fail");
  });
});
