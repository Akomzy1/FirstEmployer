/**
 * Examiner adversarial suite — the RELEASE GATE (CLAUDE.md §6.2, Build Prompt 7).
 *
 * 15 documents, each seeded with exactly one known statutory defect. The examiner
 * must catch all 15 on the correct check, WITHOUT the LLM (deterministic gate
 * only — no API key in CI). A clean Liam contract must pass all 13.
 */
import { describe, expect, it } from "vitest";
import versionsData from "../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../config/types";
import type { ContractFacts, GeneratedContract } from "../templates/contract/types";
import { renderContractFromTemplates } from "../templates/contract/render";
import { examineContract } from "./examiner-core";

const VERSIONS = (versionsData as { versions: StatutoryConfigVersion[] }).versions;
const CONFIG = (VERSIONS.find((v) => v.label === "2026.2") as StatutoryConfigVersion).values as StatutoryConfig;
const CONFIG_1 = (VERSIONS.find((v) => v.label === "2026.1") as StatutoryConfigVersion).values as StatutoryConfig;

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

function clean(): GeneratedContract {
  return renderContractFromTemplates(LIAM, CONFIG);
}

function rebuildBody(doc: GeneratedContract): string {
  return doc.clauses.map((c) => `${c.heading}\n${c.body}`).join("\n\n");
}
function setBody(doc: GeneratedContract, id: string, body: string): GeneratedContract {
  const next = { ...doc, clauses: doc.clauses.map((c) => (c.id === id ? { ...c, body } : c)) };
  return { ...next, body: rebuildBody(next) };
}
function removeClause(doc: GeneratedContract, id: string): GeneratedContract {
  const next = { ...doc, clauses: doc.clauses.filter((c) => c.id !== id) };
  return { ...next, body: rebuildBody(next) };
}

const examine = (doc: GeneratedContract, facts = LIAM, config = CONFIG) =>
  examineContract({ document: doc, facts, config, configLabel: "2026.2", attempt: 1 });

interface Fixture {
  name: string;
  check: number;
  doc: () => GeneratedContract;
  facts?: ContractFacts;
  config?: StatutoryConfig;
}

const FIXTURES: Fixture[] = [
  { name: "pay 1p under the apprentice floor", check: 3, doc: () => setBody(clean(), "pay", "Liam Carter will be paid £7.99 an hour, paid monthly. This meets the apprentice minimum wage of £8.00 an hour.") },
  { name: "pay quotes a stale/incorrect rate (not the agreed £8.00)", check: 3, doc: () => setBody(clean(), "pay", "Liam Carter will be paid £12.21 an hour, paid monthly. This meets the minimum wage.") },
  { name: "holiday below the 28-day minimum", check: 6, doc: () => setBody(clean(), "holiday", "Liam Carter gets 27 days' paid holiday a year, which can include bank holidays.") },
  { name: "holiday particular missing entirely", check: 6, doc: () => removeClause(clean(), "holiday") },
  { name: "probation particular missing (probation agreed)", check: 9, doc: () => removeClause(clean(), "probation") },
  { name: "wrong employee name in the parties clause", check: 1, doc: () => setBody(clean(), "parties", "This is an agreement between DO Plumbing & Heating Ltd (“the employer”) and Liam Byrne (“the employee”).") },
  { name: "employer not named in the parties clause", check: 1, doc: () => setBody(clean(), "parties", "This is an agreement between the employer and Liam Carter (“the employee”).") },
  { name: "start date particular missing", check: 2, doc: () => removeClause(clean(), "start_date") },
  { name: "start date is not a real / agreed date", check: 2, doc: () => setBody(clean(), "start_date", "Liam Carter's employment begins on 31 February 2026.") },
  { name: "notice below the one-week statutory floor", check: 10, doc: () => setBody(clean(), "notice", "The agreed notice period is 3 days. Liam Carter must give notice too.") },
  { name: "notice inconsistent with the agreed period", check: 10, doc: () => setBody(clean(), "notice", "The agreed notice period is 2 weeks. Liam Carter must give notice too.") },
  { name: "working hours particular missing", check: 5, doc: () => removeClause(clean(), "hours") },
  { name: "place of work particular missing", check: 7, doc: () => removeClause(clean(), "place") },
  { name: "pension particular missing", check: 12, doc: () => removeClause(clean(), "pension") },
  { name: "discipline and grievance particular missing", check: 13, doc: () => removeClause(clean(), "discipline_grievance") },
];

describe("Examiner adversarial suite — release gate (deterministic, no LLM)", () => {
  it("a clean contract passes all 13 checks", async () => {
    const r = await examine(clean());
    expect(r.verdict).toBe("pass");
    expect(r.checks.filter((c) => c.status === "fail")).toHaveLength(0);
    expect(r.checks).toHaveLength(13);
  });

  it.each(FIXTURES)("catches: $name (check #$check)", async ({ doc, check, facts, config }) => {
    const r = await examine(doc(), facts, config);
    expect(r.verdict).toBe("fail");
    const failed = r.checks.find((c) => c.id === check);
    expect(failed?.status, `check #${check} should have failed`).toBe("fail");
    expect(r.defects.some((d) => d.clauseRef === `check ${check}`)).toBe(true);
  });

  it("catches ALL 15 seeded defects (15/15)", async () => {
    let caught = 0;
    for (const f of FIXTURES) {
      const r = await examine(f.doc(), f.facts, f.config);
      if (r.verdict === "fail" && r.checks.find((c) => c.id === f.check)?.status === "fail") caught++;
    }
    expect(caught).toBe(15);
  });

  it("records the immutable seal content: examiner + config version + checklist hash", async () => {
    const r = await examine(clean());
    expect(r.examinerVersion).toBe("exam-1.0");
    expect(r.configVersion).toBe("2026.2");
    expect(r.checklistHash).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("stale-rate defense: a 2026.1 apprentice rate (£7.55) fails against live 2026.2", async () => {
    // A contract that pays the superseded apprentice rate is below the live floor.
    const doc = setBody(clean(), "pay", "Liam Carter will be paid £7.55 an hour, paid monthly.");
    const r = await examine(doc, LIAM, CONFIG);
    expect(r.verdict).toBe("fail");
    expect(r.checks.find((c) => c.id === 3)?.status).toBe("fail");
    // sanity: £7.55 WOULD have been legal under 2026.1
    expect(CONFIG_1.minimum_wage.apprentice).toBe(7.55);
  });
});
