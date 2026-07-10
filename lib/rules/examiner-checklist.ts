/**
 * The 13-point examiner checklist — the statutory spine of the written statement
 * of particulars (ERA 1996 s.1, as amended, and related). This is the STRUCTURE
 * every examination runs against (CLAUDE.md Rule 2/3).
 *
 * Hybrid evaluation (Build Prompt 7):
 * - Deterministic evaluators run for every check: they confirm the mandatory
 *   particular is PRESENT, FAITHFUL to the questionnaire facts, and meets the
 *   config FLOOR where there is one (pay, holiday, notice). These are pure rules
 *   code and are the release gate — they catch the 15 adversarial fixtures with
 *   no LLM involved, so CI can prove 15/15.
 * - The examiner LLM (in /lib/ai/examiner.ts) adds a language-level pass over the
 *   whole document for the `language`-kind checks (plain-English standard, subtle
 *   cross-clause consistency). It can only FAIL a check further; it can never
 *   rescue a deterministic FAIL. Any single FAIL fails the document.
 *
 * Changing/adding a check changes `checklistSignature()` → the checklist hash,
 * which is expected and correct (it is the VerificationSeal content).
 *
 * This module has no LLM calls and no statutory literals (every figure comes from
 * the passed config).
 */
import { createHash } from "crypto";
import type { StatutoryConfig } from "@/lib/config/types";
import type { ContractFacts, GeneratedContract } from "@/lib/templates/contract/types";
import { checkPayFloor } from "./contract/pay-floor";
import { checkHolidayFloor } from "./contract/holiday";

/** Statutory minimum employer notice once a month has been worked (ERA 1996 s.86).
 *  A legal rule (weeks), not an upratable config rate. */
const STATUTORY_MIN_NOTICE_WEEKS = 1;

export interface EvalContext {
  document: GeneratedContract;
  facts: ContractFacts;
  config: StatutoryConfig;
}

export interface EvalResult {
  status: "pass" | "fail";
  detail?: string;
  /** Structured fix instruction fed back to the generator on a revision (defect-only). */
  suggestedFix?: string;
}

export interface ExaminerCheckDef {
  id: number;
  name: string;
  plain_english: string;
  statutory_ref: string;
  /** Whether the LLM language pass also judges this check. */
  kind: "deterministic" | "language";
  /** Deterministic evaluator — present on every check (the release gate). */
  evaluator: (ctx: EvalContext) => EvalResult;
}

/* ------------------------- parsing helpers ------------------------- */

function clauseBody(doc: GeneratedContract, id: string): string | null {
  const c = doc.clauses.find((x) => x.id === id);
  return c ? c.body : null;
}

function firstMoney(text: string): number | null {
  const m = text.match(/£\s*(\d+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
}

/** First integer that directly precedes the word "day(s)". */
function daysStated(text: string): number | null {
  const m = text.match(/(\d+)\s*days?/i);
  return m ? parseInt(m[1], 10) : null;
}

/** Convert a digit-based duration ("1 week", "3 days", "1 month") to weeks. */
export function durationToWeeks(s: string): number | null {
  const m = s.match(/(\d+)\s*(day|week|month|year)s?/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  switch (m[2].toLowerCase()) {
    case "day": return n / 7;
    case "week": return n;
    case "month": return (n * 52) / 12;
    case "year": return n * 52;
    default: return null;
  }
}

function includes(text: string | null, needle: string): boolean {
  if (!text || !needle) return false;
  return text.toLowerCase().includes(needle.toLowerCase());
}

function fail(detail: string, suggestedFix: string): EvalResult {
  return { status: "fail", detail, suggestedFix };
}
const PASS: EvalResult = { status: "pass" };

/* ------------------------- the checklist ------------------------- */

export const EXAMINER_CHECKS: ExaminerCheckDef[] = [
  {
    id: 1,
    name: "Employer and employee named",
    plain_english: "The contract names both the business and the person being employed, and they match your answers.",
    statutory_ref: "ERA 1996 s.1(3)(a)",
    kind: "deterministic",
    evaluator: ({ document, facts }) => {
      const parties = clauseBody(document, "parties");
      if (!parties) return fail("The contract has no clause naming the parties.", "Add a clause naming the employer and the employee.");
      if (!includes(parties, facts.employerName)) return fail("The employer named does not match the business.", `Name the employer as ${facts.employerName}.`);
      if (!includes(parties, facts.employeeName) || !includes(document.body, facts.employeeName))
        return fail("The employee named does not match the person being hired.", `Name the employee as ${facts.employeeName}.`);
      return PASS;
    },
  },
  {
    id: 2,
    name: "Employment start date stated",
    plain_english: "The contract says the exact day the job starts, and it is a real date.",
    statutory_ref: "ERA 1996 s.1(3)(b)",
    kind: "deterministic",
    evaluator: ({ document, facts }) => {
      const body = clauseBody(document, "start_date");
      if (!body) return fail("The contract does not state a start date.", "Add the employment start date.");
      const expected = new Date(facts.startDate + "T00:00:00Z");
      // The rendered long date (e.g. "3 August 2026") must be present and valid.
      const long = isNaN(expected.getTime())
        ? null
        : expected.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
      if (!long) return fail("The start date is not a real date.", "Use a valid start date.");
      if (!includes(body, long)) return fail("The stated start date does not match the agreed start date.", `State the start date as ${long}.`);
      return PASS;
    },
  },
  {
    id: 3,
    name: "Pay meets the minimum wage",
    plain_english: "The pay in the contract is at least the minimum wage for this person's age or apprentice band.",
    statutory_ref: "NMWA 1998 s.1",
    kind: "deterministic",
    evaluator: ({ document, facts, config }) => {
      const body = clauseBody(document, "pay");
      const stated = body ? firstMoney(body) : null;
      if (stated == null) return fail("The contract does not state an hourly rate.", "State the hourly rate of pay.");
      const check = checkPayFloor({ hourlyRate: stated, config, band: facts.wageBand });
      if (!check.ok)
        return fail(
          `The stated pay of £${stated.toFixed(2)} is below the ${check.bandLabel} minimum of £${check.floor.toFixed(2)} an hour.`,
          `Raise the pay to at least £${check.floor.toFixed(2)} an hour.`,
        );
      if (Math.round(stated * 100) !== Math.round(facts.hourlyRate * 100))
        return fail(
          `The stated pay of £${stated.toFixed(2)} does not match the agreed £${facts.hourlyRate.toFixed(2)}.`,
          `State the pay as £${facts.hourlyRate.toFixed(2)} an hour.`,
        );
      return PASS;
    },
  },
  {
    id: 4,
    name: "Pay amount and interval set out",
    plain_english: "The contract says how much the pay is and how often it is paid.",
    statutory_ref: "ERA 1996 s.1(4)(a)",
    kind: "deterministic",
    evaluator: ({ document }) => {
      const body = clauseBody(document, "pay");
      if (!body) return fail("The pay clause is missing.", "Add a pay clause with the amount and interval.");
      if (firstMoney(body) == null) return fail("The pay amount is missing.", "State the pay amount.");
      if (!/(hour|week|fortnight|month)/i.test(body)) return fail("How often pay is made is not stated.", "State how often pay is made.");
      return PASS;
    },
  },
  {
    id: 5,
    name: "Working hours defined",
    plain_english: "The contract says the normal working hours.",
    statutory_ref: "ERA 1996 s.1(4)(c)",
    kind: "deterministic",
    evaluator: ({ document, facts }) => {
      const body = clauseBody(document, "hours");
      if (!body) return fail("Working hours are not stated.", "State the normal weekly working hours.");
      if (!includes(body, String(facts.weeklyHours))) return fail("The stated hours do not match the agreed hours.", `State the hours as ${facts.weeklyHours} a week.`);
      return PASS;
    },
  },
  {
    id: 6,
    name: "Holiday is at least the legal minimum",
    plain_english: "The paid holiday is at least the legal minimum for this working pattern.",
    statutory_ref: "WTR 1998 reg 13",
    kind: "deterministic",
    evaluator: ({ document, facts, config }) => {
      const body = clauseBody(document, "holiday");
      if (!body) return fail("There is no holiday clause.", "Add a holiday clause.");
      const stated = daysStated(body);
      if (stated == null) return fail("The holiday entitlement is not stated in days.", "State the paid holiday in days.");
      const check = checkHolidayFloor(config, stated, facts.daysPerWeek);
      if (!check.ok) return fail(`Holiday of ${stated} days is below the ${check.floor}-day legal minimum.`, `Raise holiday to at least ${check.floor} days.`);
      return PASS;
    },
  },
  {
    id: 7,
    name: "Place of work stated",
    plain_english: "The contract says where the person will work.",
    statutory_ref: "ERA 1996 s.1(4)(h)",
    kind: "deterministic",
    evaluator: ({ document }) => {
      const body = clauseBody(document, "place");
      if (!body || body.trim().length < 10) return fail("The place of work is not stated.", "State where the employee will work.");
      return PASS;
    },
  },
  {
    id: 8,
    name: "Job title or duties described",
    plain_english: "The contract says the job title or what the person will do.",
    statutory_ref: "ERA 1996 s.1(4)(f)",
    kind: "deterministic",
    evaluator: ({ document, facts }) => {
      const body = clauseBody(document, "job");
      if (!body) return fail("The job is not described.", "Add the job title and duties.");
      if (facts.jobTitle && !includes(body, facts.jobTitle)) return fail("The job title does not match the role.", `State the job title as ${facts.jobTitle}.`);
      return PASS;
    },
  },
  {
    id: 9,
    name: "Probation terms set out",
    plain_english: "If there is a probation period, its length and terms are set out.",
    statutory_ref: "ERA 1996 s.1(4)(ba)",
    kind: "language",
    evaluator: ({ document, facts }) => {
      const hasProbation = !!facts.probation && facts.probation.toLowerCase() !== "none";
      const body = clauseBody(document, "probation");
      if (!body) return fail("The probation clause is missing.", "Add a probation clause (or state there is none).");
      if (hasProbation && !includes(body, facts.probation)) return fail("The probation period is not set out.", `State the probation period of ${facts.probation}.`);
      return PASS;
    },
  },
  {
    id: 10,
    name: "Notice periods meet the legal floor",
    plain_english: "The notice to end the job is never less than the legal minimum, and matches what was agreed.",
    statutory_ref: "ERA 1996 s.86",
    kind: "language",
    evaluator: ({ document, facts }) => {
      const body = clauseBody(document, "notice");
      if (!body) return fail("The notice clause is missing.", "Add a notice clause.");
      const statedWeeks = durationToWeeks(body); // digit-based agreed notice (statutory text uses words)
      if (statedWeeks == null) return fail("The agreed notice period is not stated.", "State the agreed notice period.");
      if (statedWeeks < STATUTORY_MIN_NOTICE_WEEKS)
        return fail("The notice period is below the one-week legal minimum.", "Set notice to at least one week.");
      const agreed = durationToWeeks(facts.notice);
      if (agreed != null && Math.abs(agreed - statedWeeks) > 0.01)
        return fail("The notice period in the contract does not match what was agreed.", `State the notice period as ${facts.notice}.`);
      return PASS;
    },
  },
  {
    id: 11,
    name: "Sick pay and SSP explained",
    plain_english: "The contract explains sick pay and Statutory Sick Pay.",
    statutory_ref: "ERA 1996 s.1(4)(d)(ii)",
    kind: "language",
    evaluator: ({ document }) => {
      const body = clauseBody(document, "sick_pay");
      if (!body || !includes(body, "sick")) return fail("Sick pay is not explained.", "Explain sick pay and Statutory Sick Pay.");
      return PASS;
    },
  },
  {
    id: 12,
    name: "Pension arrangements included",
    plain_english: "The contract explains the workplace pension and auto-enrolment.",
    statutory_ref: "PA 2008 s.3",
    kind: "language",
    evaluator: ({ document }) => {
      const body = clauseBody(document, "pension");
      if (!body || !includes(body, "pension")) return fail("Pension arrangements are not included.", "Explain the workplace pension and auto-enrolment.");
      return PASS;
    },
  },
  {
    id: 13,
    name: "Discipline and grievance covered",
    plain_english: "The contract explains the disciplinary and grievance processes.",
    statutory_ref: "ERA 1996 s.3(1)",
    kind: "language",
    evaluator: ({ document }) => {
      const body = clauseBody(document, "discipline_grievance");
      if (!body || (!includes(body, "grievance") && !includes(body, "disciplin")))
        return fail("Discipline and grievance are not covered.", "Add a discipline and grievance clause.");
      return PASS;
    },
  },
];

/** Stable identity of the checklist definition (id + ref + kind), for the hash. */
export function checklistSignature(): string {
  return EXAMINER_CHECKS.map((c) => `${c.id}:${c.statutory_ref}:${c.kind}`).join("|");
}

/** Hash of checklist definition + config version + examiner version — the VerificationSeal content. */
export function computeChecklistHash(configLabel: string, examinerVersion: string): string {
  const sig = `${checklistSignature()}|${configLabel}|${examinerVersion}`;
  const hex = createHash("sha256").update(sig).digest("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/** Run every deterministic evaluator over the artefact. The release gate. */
export function runDeterministicChecks(ctx: EvalContext): { id: number; result: EvalResult }[] {
  return EXAMINER_CHECKS.map((c) => ({ id: c.id, result: c.evaluator(ctx) }));
}
