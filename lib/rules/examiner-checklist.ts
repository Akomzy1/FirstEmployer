/**
 * The 13-point examiner checklist — the statutory spine of the written statement
 * of particulars (ERA 1996 s.1, as amended, and related). This is the STRUCTURE
 * every examination runs against (CLAUDE.md Rule 2/3).
 *
 * P06 defines the checklist shape and metadata. P07 attaches an `evaluator` to
 * each check (deterministic where mechanically checkable — pay floor, holiday,
 * parties, dates; the language-level checks go to the examiner LLM at temp 0).
 * Adding/removing a check changes the checklist hash — that is expected.
 *
 * `plain_english` is reading age 9 and reused verbatim in the examiner report UI.
 */
export interface ExaminerCheckDef {
  id: number;
  name: string;
  plain_english: string;
  statutory_ref: string;
  /** How the check is judged: a deterministic evaluator (P07) or the examiner LLM. */
  kind: "deterministic" | "language";
}

export const EXAMINER_CHECKS: ExaminerCheckDef[] = [
  { id: 1, name: "Employer and employee named", plain_english: "The contract names both the business and the person being employed, and they match your answers.", statutory_ref: "ERA 1996 s.1(3)(a)", kind: "deterministic" },
  { id: 2, name: "Employment start date stated", plain_english: "The contract says the exact day the job starts.", statutory_ref: "ERA 1996 s.1(3)(b)", kind: "deterministic" },
  { id: 3, name: "Pay meets the minimum wage", plain_english: "The pay is at least the minimum wage for this person's age or apprentice band.", statutory_ref: "NMWA 1998 s.1", kind: "deterministic" },
  { id: 4, name: "Pay amount and interval set out", plain_english: "The contract says how much the pay is and how often it is paid.", statutory_ref: "ERA 1996 s.1(4)(a)", kind: "deterministic" },
  { id: 5, name: "Working hours defined", plain_english: "The contract says the normal working hours.", statutory_ref: "ERA 1996 s.1(4)(c)", kind: "deterministic" },
  { id: 6, name: "Holiday is at least the legal minimum", plain_english: "The paid holiday is at least the legal minimum for this working pattern.", statutory_ref: "WTR 1998 reg 13", kind: "deterministic" },
  { id: 7, name: "Place of work stated", plain_english: "The contract says where the person will work.", statutory_ref: "ERA 1996 s.1(4)(h)", kind: "deterministic" },
  { id: 8, name: "Job title or duties described", plain_english: "The contract says the job title or what the person will do.", statutory_ref: "ERA 1996 s.1(4)(f)", kind: "deterministic" },
  { id: 9, name: "Probation terms set out", plain_english: "If there is a probation period, its length and terms are set out.", statutory_ref: "ERA 1996 s.1(4)(ba)", kind: "language" },
  { id: 10, name: "Notice periods meet the legal floor", plain_english: "The notice to end the job is never less than the legal minimum, and the clauses agree with each other.", statutory_ref: "ERA 1996 s.86", kind: "language" },
  { id: 11, name: "Sick pay and SSP explained", plain_english: "The contract explains sick pay and Statutory Sick Pay.", statutory_ref: "ERA 1996 s.1(4)(d)(ii)", kind: "language" },
  { id: 12, name: "Pension arrangements included", plain_english: "The contract explains the workplace pension and auto-enrolment.", statutory_ref: "PA 2008 s.3", kind: "language" },
  { id: 13, name: "Discipline and grievance covered", plain_english: "The contract explains the disciplinary and grievance processes.", statutory_ref: "ERA 1996 s.3(1)", kind: "language" },
];

/** Stable identity of the checklist definition (id + ref + kind), for the hash. */
export function checklistSignature(): string {
  return EXAMINER_CHECKS.map((c) => `${c.id}:${c.statutory_ref}:${c.kind}`).join("|");
}
