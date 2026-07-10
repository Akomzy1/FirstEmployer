/**
 * Examiner STUB (P06 only). The real, independent examiner lands in P07; this
 * stub exists so the generation pipeline can be built and tested end-to-end now.
 *
 * It runs the genuine deterministic checks we already own (pay floor, holiday,
 * parties, dates, presence of mandatory particulars) so a truly defective
 * contract really fails — and drives the language-level checks from a `directive`
 * so the three prototype paths (first-pass approve, fix-then-pass, needs-human)
 * are all reproducible. P07 replaces the language-level simulation with the real
 * LLM examiner while keeping the deterministic checks.
 */
import { checkPayFloor } from "../rules/contract/pay-floor";
import { checkHolidayFloor } from "../rules/contract/holiday";
import { EXAMINER_CHECKS, computeChecklistHash } from "../rules/examiner-checklist";
import type {
  Examine,
  ExamineInput,
  ExaminationCheck,
  ExaminationDefect,
  ExaminationResult,
} from "./examiner-types";

export const STUB_EXAMINER_VERSION = "exam-stub-1.0";
export { computeChecklistHash };

/** Which prototype path to reproduce for the language-level checks. */
export type ExaminerDirective = "approve" | "fix" | "human";

/** The check the fix/human paths trip on — notice consistency (check #10). */
const NOTICE_CHECK_ID = 10;
const NOTICE_DEFECT: ExaminationDefect = {
  clauseRef: "clauses 4 and 12",
  issue: "Notice period was inconsistent between clauses.",
  statutoryBasis: "ERA 1996 s.86",
  suggestedFix: "Make the notice period identical wherever it appears, and never below the statutory minimum.",
};

function truthy(s: string | null | undefined): boolean {
  return !!s && s.trim().length > 0;
}

/** Run the genuine deterministic evaluators over the facts + document. */
function deterministicChecks(input: ExamineInput): Map<number, ExaminationCheck> {
  const { facts, config, document } = input;
  const byId = new Map<number, ExaminationCheck>();
  const meta = (id: number) => EXAMINER_CHECKS.find((c) => c.id === id)!;
  const put = (id: number, status: "pass" | "fail", detail?: string) => {
    const m = meta(id);
    byId.set(id, { id, name: m.name, status, detail, statutoryRef: m.statutory_ref });
  };

  const bothNamed = truthy(facts.employerName) && truthy(facts.employeeName) && document.body.includes(facts.employeeName);
  put(1, bothNamed ? "pass" : "fail", bothNamed ? undefined : "Employer or employee name is missing from the contract.");

  const startOk = !isNaN(new Date(facts.startDate).getTime());
  put(2, startOk ? "pass" : "fail", startOk ? undefined : "The start date is missing or not a real date.");

  const pay = checkPayFloor({ hourlyRate: facts.hourlyRate, config, band: facts.wageBand });
  put(3, pay.ok ? "pass" : "fail", pay.ok ? undefined : `Pay of £${facts.hourlyRate.toFixed(2)} is below the ${pay.bandLabel} minimum of £${pay.floor.toFixed(2)}.`);

  put(4, facts.hourlyRate > 0 && truthy(facts.payInterval) ? "pass" : "fail", "Pay amount and interval.");
  put(5, facts.weeklyHours > 0 ? "pass" : "fail", "Working hours.");

  const holiday = checkHolidayFloor(config, facts.holidayDays, facts.daysPerWeek);
  put(6, holiday.ok ? "pass" : "fail", holiday.ok ? undefined : `Holiday of ${facts.holidayDays} days is below the ${holiday.floor}-day minimum.`);

  put(7, truthy(facts.place) ? "pass" : "fail", "Place of work.");
  put(8, truthy(facts.jobTitle) ? "pass" : "fail", "Job title or duties.");
  return byId;
}

/**
 * Build a stub examiner for a directive. Deterministic checks are always real;
 * language-level checks follow the directive (and attempt number for the fix path).
 */
export function makeStubExaminer(directive: ExaminerDirective): Examine {
  return async (input: ExamineInput): Promise<ExaminationResult> => {
    const deterministic = deterministicChecks(input);
    const checks: ExaminationCheck[] = [];
    const defects: ExaminationDefect[] = [];

    for (const def of EXAMINER_CHECKS) {
      const det = deterministic.get(def.id);
      if (det) {
        checks.push(det);
        if (det.status === "fail") {
          defects.push({
            clauseRef: `check ${def.id}`,
            issue: det.detail ?? def.name,
            statutoryBasis: def.statutory_ref,
            suggestedFix: `Correct so that: ${def.plain_english}`,
          });
        }
        continue;
      }
      // Language-level check — simulate per directive.
      let status: "pass" | "fail" = "pass";
      if (def.id === NOTICE_CHECK_ID) {
        if (directive === "human") status = "fail";
        else if (directive === "fix") status = input.attempt < 2 ? "fail" : "pass";
      }
      checks.push({
        id: def.id,
        name: def.name,
        status,
        detail: status === "fail" ? NOTICE_DEFECT.issue : undefined,
        statutoryRef: def.statutory_ref,
      });
      if (status === "fail") defects.push(NOTICE_DEFECT);
    }

    const verdict = checks.every((c) => c.status === "pass") ? "pass" : "fail";
    return {
      verdict,
      attempt: input.attempt,
      checks,
      defects,
      examinerVersion: STUB_EXAMINER_VERSION,
      configVersion: input.configLabel,
      checklistHash: computeChecklistHash(input.configLabel, STUB_EXAMINER_VERSION),
    };
  };
}
