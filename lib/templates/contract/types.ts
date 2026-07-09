/**
 * Types for the employment-contract clause library and generated artefact.
 *
 * The clause library is the solicitor-owned source of legal text (parameterised).
 * Every clause carries the statutory reference it satisfies and the Examiner
 * check id it maps to, so generation and examination share one spine.
 */
import type { WageBandInput } from "@/lib/rules/contract/pay-floor";

/** Normalised questionnaire payload — the facts a contract is built from. */
export interface ContractFacts {
  /** Employing business. */
  employerName: string;
  employerType: "sole_trader" | "limited";
  employerPlace?: string | null;
  /** The employee. */
  employeeName: string;
  /** Facts that decide the wage band (dob / apprentice / apprenticeship start). */
  wageBand: WageBandInput;

  jobTitle: string;
  duties: string;
  place: string;

  /** Gross hourly rate in pounds. */
  hourlyRate: number;
  weeklyHours: number;
  /** How often pay is made. */
  payInterval: "Weekly" | "Fortnightly" | "Monthly";

  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** e.g. "None" | "1 month" | "3 months" | "6 months". */
  probation: string;
  /** e.g. "1 week" | "2 weeks" | "1 month". */
  notice: string;
  /** Annual paid holiday in days. */
  holidayDays: number;
  /** Working days per week, if known (for holiday pro-rata). */
  daysPerWeek?: number | null;

  sickPay: "ssp" | "company";
  pension: "nest" | "other";
}

export interface ContractClause {
  /** Stable clause id, e.g. "parties". */
  id: string;
  /** Human heading rendered in the document. */
  heading: string;
  /** Statutory reference this clause satisfies, e.g. "ERA 1996 s.1(3)(a)". */
  statutoryRef: string;
  /** The Examiner check id (1–13) this clause is responsible for. */
  checkId: number;
  /** Rendered clause body (plain English, reading age 9). */
  body: string;
}

export interface GeneratedContract {
  title: string;
  clauses: ContractClause[];
  /** Assembled plain-text document (headings + bodies). */
  body: string;
  /** How the artefact was produced. */
  source: "template" | "assistant";
}
