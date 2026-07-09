import type { StatutoryConfig } from "@/lib/config/types";

/**
 * The 6-question "already an employer" gap check (FR-2.7).
 * Copy is reproduced verbatim from the Onboarding prototype, EXCEPT every
 * statutory figure is interpolated from live config (Rule 4) rather than
 * hardcoded — so there are no statutory literals in this file.
 */

export type GapSeverity = "urgent" | "approaching" | "comfortable";

export type ObligationType =
  | "el_insurance"
  | "hmrc_paye"
  | "written_statement"
  | "right_to_work"
  | "pension_enrolment"
  | "record_keeping";

export interface GapQuestion {
  id: string;
  short: string;
  /** Obligation created when this is answered "no". */
  obligationType: ObligationType;
  severity: GapSeverity;
  q: string;
  help: string;
  receipt: { ref: string; plain: string; url: string };
  yes: string;
  no: string;
  /** Empty when a "no" here is a tidy-up, not a first-class gap card. */
  gapTitle: string;
  gapWhy: string;
}

const WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const numberWord = (n: number) => WORD[n] ?? String(n);
const gbp = (n: number) => "£" + n.toLocaleString("en-GB");
const gbpMillions = (n: number) => "£" + n / 1_000_000 + " million";

/** Build the gap questions with all statutory figures resolved from config. */
export function buildGapQuestions(config: StatutoryConfig): GapQuestion[] {
  const mw = config.minimum_wage;
  void mw;
  const el = config.insurance;
  const rtw = config.right_to_work;
  const pen = config.pension;
  const ep = config.employment_penalties;

  return [
    {
      id: "insurance",
      short: "Employers' liability insurance",
      obligationType: "el_insurance",
      severity: "urgent",
      q: "Do you have employers' liability insurance in place today?",
      help: `Almost every employer must have it — cover of at least ${gbpMillions(
        el.el_min_cover,
      )} — from the day a first member of staff starts.`,
      receipt: {
        ref: "ELCA 1969 s.1",
        plain: `If you employ staff you must hold employers' liability insurance of at least ${gbpMillions(
          el.el_min_cover,
        )}. Not having it can cost ${gbp(el.el_penalty_per_day)} for every day you're uninsured.`,
        url: "https://www.gov.uk/employers-liability-insurance",
      },
      yes: "Yes, I have a current policy",
      no: "No, or I'm not sure",
      gapTitle: "Get employers' liability insurance",
      gapWhy: `You could be fined ${gbp(
        el.el_penalty_per_day,
      )} for every day you employ someone without cover.`,
    },
    {
      id: "paye",
      short: "PAYE registration",
      obligationType: "hmrc_paye",
      severity: "comfortable",
      q: "Are you registered with HMRC as an employer?",
      help: "You need a PAYE scheme to pay staff and handle their tax and National Insurance.",
      receipt: {
        ref: "PAYE Regs 2003",
        plain:
          "Before the first payday you must register with HMRC as an employer. It's free and takes about ten minutes.",
        url: "https://www.gov.uk/register-employer",
      },
      yes: "Yes, I'm registered for PAYE",
      no: "No, or I'm not sure",
      gapTitle: "",
      gapWhy: "",
    },
    {
      id: "contract",
      short: "Written contracts",
      obligationType: "written_statement",
      severity: "approaching",
      q: "Does every employee have a written contract?",
      help: "Each employee must get a written statement of their main terms on or before their first day.",
      receipt: {
        ref: "ERA 1996 s.1",
        plain:
          "Every employee must be given a written statement of their job terms — pay, hours, holiday — on or before day one.",
        url: "https://www.gov.uk/employment-contracts-and-conditions",
      },
      yes: "Yes, everyone has one in writing",
      no: "No, some or none are in writing",
      gapTitle: "Issue written contracts",
      gapWhy: `Staff without a written statement can take you to a tribunal for up to ${numberWord(
        ep.written_statement_tribunal_weeks,
      )} weeks' pay each.`,
    },
    {
      id: "rtw",
      short: "Right-to-work checks",
      obligationType: "right_to_work",
      severity: "urgent",
      q: "Have you checked everyone's right to work in the UK?",
      help: "You must confirm each person can legally work here, and keep a dated copy of the evidence.",
      receipt: {
        ref: "IANA 2006 s.15",
        plain: `You must check every employee can legally work in the UK and keep a record. A correct check protects you from a fine of up to ${gbp(
          rtw.penalty_first_breach,
        )} per worker.`,
        url: "https://www.gov.uk/check-job-applicant-right-to-work",
      },
      yes: "Yes, checked and recorded for all",
      no: "No, or I didn't keep records",
      gapTitle: "Complete right-to-work checks",
      gapWhy: `An incorrect or missing check risks a civil penalty of up to ${gbp(
        rtw.penalty_first_breach,
      )} for each worker.`,
    },
    {
      id: "pension",
      short: "Workplace pension",
      obligationType: "pension_enrolment",
      severity: "approaching",
      q: "Have you set up a workplace pension?",
      help: "Most employers must offer a pension and put eligible staff into it automatically.",
      receipt: {
        ref: "PA 2008 s.3",
        plain: `You must automatically enrol eligible staff into a workplace pension and pay in at least ${pen.min_employer_contribution_pct}% of their qualifying earnings.`,
        url: "https://www.gov.uk/workplace-pensions-employers",
      },
      yes: "Yes, a scheme is up and running",
      no: "No, or I'm not sure",
      gapTitle: "Set up auto-enrolment pension",
      gapWhy: `The Pensions Regulator can issue fixed penalties of ${gbp(
        ep.tpr_auto_enrolment_fixed,
      )}, then daily fines, for not enrolling staff.`,
    },
    {
      id: "records",
      short: "Pay & holiday records",
      obligationType: "record_keeping",
      severity: "comfortable",
      q: "Do you keep pay and holiday records for your staff?",
      help: "You must keep records of what you pay and the holiday people take.",
      receipt: {
        ref: "WTR 1998 reg 9",
        plain: `You must keep records showing you meet working-time and holiday rules, and keep pay records for ${numberWord(
          ep.pay_record_retention_years,
        )} years.`,
        url: "https://www.gov.uk/running-payroll",
      },
      yes: "Yes, I keep proper records",
      no: "No, not really",
      gapTitle: "",
      gapWhy: "",
    },
  ];
}

/** Config-independent metadata: gap id → obligation type + severity + short label.
 *  Used by server actions (which map answers to obligations) without needing config. */
export const GAP_META: Array<{
  id: string;
  obligationType: ObligationType;
  severity: GapSeverity;
  short: string;
}> = [
  { id: "insurance", obligationType: "el_insurance", severity: "urgent", short: "Employers' liability insurance" },
  { id: "paye", obligationType: "hmrc_paye", severity: "comfortable", short: "PAYE registration" },
  { id: "contract", obligationType: "written_statement", severity: "approaching", short: "Written contracts" },
  { id: "rtw", obligationType: "right_to_work", severity: "urgent", short: "Right-to-work checks" },
  { id: "pension", obligationType: "pension_enrolment", severity: "approaching", short: "Workplace pension" },
  { id: "records", obligationType: "record_keeping", severity: "comfortable", short: "Pay & holiday records" },
];

export const SEVERITY_META: Record<GapSeverity, { chip: string; label: string; icon: string; order: number }> = {
  urgent: { chip: "fe-deadline--urgent", label: "Fix first", icon: "error", order: 0 },
  approaching: { chip: "fe-deadline--approaching", label: "Fix soon", icon: "schedule", order: 1 },
  comfortable: { chip: "fe-deadline--comfortable", label: "Tidy up", icon: "info", order: 2 },
};
