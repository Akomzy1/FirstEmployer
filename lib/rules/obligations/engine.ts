/**
 * Obligations engine — the dashboard's brain (Build Prompt 9, FR-5.1/5.2).
 * Pure rules code (CLAUDE.md Rule 1): derives the eight dashboard obligations,
 * their display states, the ring tone, and the headline copy from a snapshot of
 * the business's records. Identical inputs → identical outputs; no LLM, no I/O.
 *
 * The eight segments and their fixed order come from the dashboard prototype
 * (the ring's segment order). Each maps onto one or more DB obligation rows:
 *
 *   status    ← a determination exists (employment_status)
 *   paye      ← hmrc_paye
 *   payroll   ← payroll
 *   pension   ← pension_enrolment + pension_declaration (declaration is first-class)
 *   insurance ← el_insurance (expiry-tracked)
 *   contract  ← written_statement + minimum_wage (an uprating gap makes the
 *               contract's pay clause illegal, so the flag surfaces here — J4)
 *   rtw       ← right_to_work (follow-up expiry-tracked)
 *   records   ← record_keeping
 *
 * Display state per segment: verified | attention | overdue | pending.
 *   pending   — no row yet (module not reached)
 *   verified  — met (complete)
 *   attention — a row exists and needs a step (not_started/in_progress/blocked)
 *   overdue   — past its due date, or flagged at_risk/overdue (live non-compliance)
 */
// The DeadlineChip module owns the grading thresholds (DECISIONS P01) and its
// date helpers are pure — one source of truth for "how urgent is this date".
import { daysUntil, gradeFromDueDate, formatDeadline, type DeadlineGrade } from "../../../components/system/status/DeadlineChip";

export type SegmentId = "status" | "paye" | "payroll" | "pension" | "insurance" | "contract" | "rtw" | "records";
export type SegmentState = "verified" | "attention" | "overdue" | "pending";
export type RingTone = "green" | "amber" | "red";

/** A DB obligations row, reduced to what the engine needs. */
export interface ObligationRowInput {
  type: string;
  state: "not_started" | "in_progress" | "blocked" | "complete" | "at_risk" | "overdue";
  due_date: string | null;
}

export interface DashboardSnapshot {
  /** ISO date used for all date math — pass explicitly so results are reproducible. */
  today: string;
  ownerFirstName: string;
  hasDetermination: boolean;
  obligations: ObligationRowInput[];
}

export interface SegmentResult {
  id: SegmentId;
  state: SegmentState;
  /** Earliest open due date feeding this segment, if any. */
  dueDate: string | null;
  deadline: { grade: DeadlineGrade; label: string } | null;
}

export interface DashboardResult {
  segments: SegmentResult[];
  metCount: number;
  tone: RingTone;
  headline: string;
  subline: string;
  centre: { big: string; small: string };
  /** Open dated obligations inside the next 90 days, earliest first. */
  timeline: { date: string; frac: number; label: string; grade: DeadlineGrade; segment: SegmentId }[];
}

export const ENGINE_VERSION = "obl-1.0";

/** Segment → the DB obligation types that feed it (order matters for the ring). */
export const SEGMENT_SOURCES: { id: SegmentId; label: string; types: string[] }[] = [
  { id: "status", label: "Employment status", types: ["employment_status"] },
  { id: "paye", label: "HMRC PAYE", types: ["hmrc_paye"] },
  { id: "payroll", label: "Payroll", types: ["payroll"] },
  { id: "pension", label: "Pension", types: ["pension_enrolment", "pension_declaration"] },
  { id: "insurance", label: "EL insurance", types: ["el_insurance"] },
  { id: "contract", label: "Contract", types: ["written_statement", "minimum_wage"] },
  { id: "rtw", label: "Right to work", types: ["right_to_work"] },
  { id: "records", label: "Records", types: ["record_keeping"] },
];

/** Timeline labels for dated obligation types (plain English, reading age 9). */
const TIMELINE_LABEL: Record<string, string> = {
  pension_declaration: "Pension declaration due",
  el_insurance: "EL insurance renews",
  right_to_work: "Right to work follow-up",
  hmrc_paye: "PAYE registration",
  payroll: "Payroll step",
  written_statement: "Contract due",
  minimum_wage: "Pay below new minimum",
  record_keeping: "Records check",
  employment_status: "Status check",
  pension_enrolment: "Pension enrolment",
};

function rowDisplayState(row: ObligationRowInput, today: string): SegmentState {
  if (row.state === "complete") return "verified";
  if (row.state === "at_risk" || row.state === "overdue") return "overdue";
  if (row.due_date && daysUntil(row.due_date, new Date(today + "T00:00:00Z")) < 0) return "overdue";
  return "attention";
}

const STATE_RANK: Record<SegmentState, number> = { pending: 0, verified: 1, attention: 2, overdue: 3 };

/** Combine multiple feeding rows into one segment state (worst wins; verified only if all met). */
function combine(states: SegmentState[]): SegmentState {
  if (states.length === 0) return "pending";
  return states.reduce((worst, s) => (STATE_RANK[s] > STATE_RANK[worst] ? s : worst),
    states.every((s) => s === "verified") ? "verified" : states[0]);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Derive the full dashboard from a snapshot. Pure. */
export function deriveDashboard(snapshot: DashboardSnapshot): DashboardResult {
  const now = new Date(snapshot.today + "T00:00:00Z");
  const byType = new Map<string, ObligationRowInput[]>();
  for (const row of snapshot.obligations) {
    const list = byType.get(row.type) ?? [];
    list.push(row);
    byType.set(row.type, list);
  }

  const segments: SegmentResult[] = SEGMENT_SOURCES.map(({ id, types }) => {
    const rows = types.flatMap((t) => byType.get(t) ?? []);
    let state: SegmentState;
    if (id === "status") {
      // The status segment is met the moment a determination exists.
      state = snapshot.hasDetermination
        ? "verified"
        : rows.length
          ? combine(rows.map((r) => rowDisplayState(r, snapshot.today)))
          : "pending";
    } else if (rows.length === 0) {
      state = "pending";
    } else {
      state = combine(rows.map((r) => rowDisplayState(r, snapshot.today)));
    }

    // Earliest open due date drives the chip.
    const openDates = rows
      .filter((r) => r.state !== "complete" && r.due_date)
      .map((r) => r.due_date as string)
      .sort();
    const dueDate = openDates[0] ?? null;
    const deadline = dueDate
      ? { grade: gradeFromDueDate(dueDate, now), label: formatDeadline(dueDate, now) }
      : null;
    return { id, state, dueDate, deadline };
  });

  const metCount = segments.filter((s) => s.state === "verified").length;
  const overdueSegs = segments.filter((s) => s.state === "overdue");
  const openSegs = segments.filter((s) => s.state === "attention" || s.state === "pending");
  const tone: RingTone = overdueSegs.length ? "red" : metCount === segments.length ? "green" : "amber";

  // Headline copy — per the prototype, exactly.
  let headline: string;
  let subline: string;
  if (tone === "green") {
    headline = `You're compliant, ${snapshot.ownerFirstName}.`;
    // "Next deadline" considers every future dated row — a met obligation can
    // still carry an upcoming date (pension declaration, insurance renewal).
    const next = snapshot.obligations
      .filter((r) => r.due_date && daysUntil(r.due_date, now) >= 0)
      .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0];
    const nextLabel = next
      ? ` Next deadline: ${(TIMELINE_LABEL[next.type] ?? next.type).toLowerCase().replace(/ due$| renews$/, "")}, ${shortDate(next.due_date!)}.`
      : "";
    subline = `All ${segments.length} obligations met.${nextLabel}`;
  } else if (tone === "red") {
    const n = overdueSegs.length;
    headline = `${n} ${plural(n, "item is", "items are")} overdue`;
    const first = overdueSegs[0];
    const firstLabel = SEGMENT_SOURCES.find((x) => x.id === first.id)!.label;
    const daysOver = first.dueDate ? Math.abs(daysUntil(first.dueDate, now)) : null;
    subline = daysOver
      ? `${firstLabel} is ${daysOver} ${plural(daysOver, "day", "days")} overdue. Let's sort it now — it only takes a minute.`
      : `${firstLabel} needs sorting now. It only takes a minute.`;
  } else {
    const n = openSegs.length;
    headline = `${n} ${plural(n, "item needs", "items need")} attention`;
    subline = `Nothing is overdue. ${n === 1 ? "One obligation needs" : `${numberWord(n)} obligations need`} a small step from you this month.`;
  }

  const centre = {
    big: String(metCount),
    small:
      tone === "green"
        ? `of ${segments.length} met`
        : tone === "red"
          ? `of ${segments.length} · ${overdueSegs.length} overdue`
          : `of ${segments.length} · ${openSegs.length} to do`,
  };

  // 90-day timeline from open dated rows.
  const timeline = snapshot.obligations
    .filter((r) => r.state !== "complete" && r.due_date)
    .map((r) => ({ row: r, days: daysUntil(r.due_date!, now) }))
    .filter(({ days }) => days >= 0 && days <= 90)
    .sort((a, b) => a.days - b.days)
    .map(({ row, days }) => ({
      date: row.due_date!,
      frac: days / 90,
      label: TIMELINE_LABEL[row.type] ?? row.type,
      grade: gradeFromDueDate(row.due_date!, now),
      segment: (SEGMENT_SOURCES.find((s) => s.types.includes(row.type))?.id ?? "records") as SegmentId,
    }));

  return { segments, metCount, tone, headline, subline, centre, timeline };
}

function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function numberWord(n: number): string {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
  return words[n] ?? String(n);
}
