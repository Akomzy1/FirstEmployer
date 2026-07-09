// LEGAL-REVIEW: This clause library is placeholder legal text pending solicitor
// sign-off (CLAUDE.md §8 launch blocker). Every clause here must be reviewed and
// approved by a qualified employment solicitor before launch. Do not treat the
// wording as settled law. Statutory VALUES are never written here — they are
// interpolated from `getLiveConfig()` (Rule 4); only statutory RULES (the s.1
// particulars, the s.86 notice ladder) appear as text, and those are flagged for
// the same review.
import type { StatutoryConfig } from "@/lib/config/types";
import { checkPayFloor } from "../../rules/contract/pay-floor";
import { holidayFloorDays } from "../../rules/contract/holiday";
import type { ContractClause, ContractFacts } from "./types";

function gbp(amount: number): string {
  return "£" + amount.toFixed(2);
}

function longDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Statutory notice the EMPLOYER must give, in plain words (ERA 1996 s.86). */
function statutoryNoticeText(name: string): string {
  return (
    `Once ${name} has worked for one month, you must give at least one week's notice to end the job. ` +
    `This rises by one more week for each full year worked, up to twelve weeks after twelve years. ` +
    `${name} must give you at least one week's notice once they have worked for one month.`
  );
}

/**
 * The parameterised clause library. Each entry renders one clause of the written
 * statement of particulars from the questionnaire facts and live config, and
 * records the statutory reference + Examiner check it answers to.
 */
export function renderClauses(facts: ContractFacts, config: StatutoryConfig): ContractClause[] {
  const name = facts.employeeName;
  const employer = facts.employerName;
  const pay = checkPayFloor({ hourlyRate: facts.hourlyRate, config, band: facts.wageBand });
  const holidayFloor = holidayFloorDays(config, facts.daysPerWeek);
  const pensionEmployerPct = config.pension.min_employer_contribution_pct;
  const pensionTotalPct = config.pension.min_total_contribution_pct;

  const clauses: ContractClause[] = [
    {
      id: "parties",
      heading: "1. Who this agreement is between",
      statutoryRef: "ERA 1996 s.1(3)(a)",
      checkId: 1,
      body:
        `This is an agreement between ${employer} (“the employer”) and ${name} (“the employee”). ` +
        `It sets out the main terms of ${name}'s employment, as the law requires from the first day of work.`,
    },
    {
      id: "start_date",
      heading: "2. When the job starts",
      statutoryRef: "ERA 1996 s.1(3)(b)",
      checkId: 2,
      body: `${name}'s employment begins on ${longDate(facts.startDate)}. This is the date continuous employment starts from.`,
    },
    {
      id: "job",
      heading: "3. The job",
      statutoryRef: "ERA 1996 s.1(4)(f)",
      checkId: 8,
      body: `${name}'s job title is ${facts.jobTitle}. The main duties are: ${facts.duties}`,
    },
    {
      id: "place",
      heading: "4. Where the work is done",
      statutoryRef: "ERA 1996 s.1(4)(h)",
      checkId: 7,
      body: `${name} will work at, or from: ${facts.place}`,
    },
    {
      id: "pay",
      heading: "5. Pay",
      statutoryRef: "ERA 1996 s.1(4)(a)",
      checkId: 4,
      body:
        `${name} will be paid ${gbp(facts.hourlyRate)} an hour, paid ${facts.payInterval.toLowerCase()}. ` +
        `This meets the ${pay.bandLabel} minimum wage of ${gbp(pay.floor)} an hour, so the job is paid at least the legal minimum.`,
    },
    {
      id: "hours",
      heading: "6. Working hours",
      statutoryRef: "ERA 1996 s.1(4)(c)",
      checkId: 5,
      body: `${name} will normally work ${facts.weeklyHours} hours a week. Any regular pattern or overtime will be agreed in advance.`,
    },
    {
      id: "holiday",
      heading: "7. Holiday",
      statutoryRef: "WTR 1998 reg 13",
      checkId: 6,
      body:
        `${name} gets ${facts.holidayDays} days' paid holiday a year, which can include bank holidays. ` +
        `This meets or beats the legal minimum of ${holidayFloor} days for this working pattern. The holiday year runs from the start date.`,
    },
    {
      id: "probation",
      heading: "8. Probation",
      statutoryRef: "ERA 1996 s.1(4)(ba)",
      checkId: 9,
      body:
        facts.probation && facts.probation !== "None"
          ? `The first ${facts.probation} of employment is a probation period. During this time either side can end the job with shorter notice, and support will be given to help ${name} settle in.`
          : `There is no probation period. ${name} is a permanent employee from the start date.`,
    },
    {
      id: "notice",
      heading: "9. Notice to end the job",
      statutoryRef: "ERA 1996 s.86",
      checkId: 10,
      body:
        `The agreed notice period is ${facts.notice}. This can never be less than the legal minimum. ` +
        statutoryNoticeText(name),
    },
    {
      id: "sick_pay",
      // LEGAL-REVIEW: SSP weekly amount is a statutory rate but is not yet in
      // config, so it is referenced by name, not by figure (Rule 4 + "never
      // invent statutory content"). Add ssp.weekly_rate to config before quoting it.
      heading: "10. Time off sick and sick pay",
      statutoryRef: "ERA 1996 s.1(4)(d)(ii)",
      checkId: 11,
      body:
        facts.sickPay === "company"
          ? `If ${name} is off sick, they will receive company sick pay on top of Statutory Sick Pay (SSP). SSP is paid at the statutory rate the government sets, once ${name} qualifies.`
          : `If ${name} is off sick and qualifies, they will receive Statutory Sick Pay (SSP) at the statutory rate the government sets. ${name} must tell you as soon as possible when off sick.`,
    },
    {
      id: "pension",
      heading: "11. Workplace pension",
      statutoryRef: "PA 2008 s.3",
      checkId: 12,
      body:
        `You must put ${name} into a workplace pension and pay in once they qualify — this is called auto-enrolment. ` +
        `The minimum total contribution is ${pensionTotalPct}% of qualifying earnings, of which at least ${pensionEmployerPct}% is paid by you as the employer. ` +
        (facts.pension === "nest"
          ? `${name} will be enrolled into NEST, the government-backed scheme.`
          : `${name} will be enrolled into your workplace pension scheme.`),
    },
    {
      id: "discipline_grievance",
      heading: "12. Discipline and raising a concern",
      statutoryRef: "ERA 1996 s.3(1)",
      checkId: 13,
      body:
        `If something goes wrong, the disciplinary process will be followed fairly. ` +
        `If ${name} has a concern or complaint, they can raise a grievance with you and it will be dealt with fairly. ` +
        `Both processes follow the ACAS Code of Practice.`,
    },
  ];

  return clauses;
}
