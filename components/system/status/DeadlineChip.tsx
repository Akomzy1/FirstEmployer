import * as React from "react";

export type DeadlineGrade = "comfortable" | "approaching" | "urgent" | "overdue";

const GRADE: Record<DeadlineGrade, { icon: string }> = {
  comfortable: { icon: "schedule" },
  approaching: { icon: "schedule" },
  urgent: { icon: "hourglass_top" },
  overdue: { icon: "error" },
};

/* UX grading thresholds (not statutory values — statutory offsets live in config).
   Chosen to match every prototype example: 12 days → approaching, 3 days → urgent,
   4 months → comfortable. Logged in DECISIONS.md (P01). */
const URGENT_WITHIN_DAYS = 7;
const APPROACHING_WITHIN_DAYS = 30;

const MS_PER_DAY = 86_400_000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days from `now` to `dueDate` (negative when overdue). Pure. */
export function daysUntil(dueDate: Date | string, now: Date): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return Math.round((startOfDay(due) - startOfDay(now)) / MS_PER_DAY);
}

/** Grade escalates calmly: comfortable (neutral) → approaching (amber) → urgent (amber-red) → overdue (red). Pure. */
export function gradeFromDueDate(dueDate: Date | string, now: Date): DeadlineGrade {
  const days = daysUntil(dueDate, now);
  if (days < 0) return "overdue";
  if (days <= URGENT_WITHIN_DAYS) return "urgent";
  if (days <= APPROACHING_WITHIN_DAYS) return "approaching";
  return "comfortable";
}

/** Plain-English label, reading age 9: "Due in 12 days", "Due today", "5 days overdue". Pure. */
export function formatDeadline(dueDate: Date | string, now: Date): string {
  const days = daysUntil(dueDate, now);
  if (days < 0) {
    const n = Math.abs(days);
    return n === 1 ? "1 day overdue" : `${n} days overdue`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 60) return `Due in ${days} days`;
  const months = Math.round(days / 30.44);
  return months === 1 ? "Due in 1 month" : `Due in ${months} months`;
}

export interface DeadlineChipProps {
  /** Explicit grade, or pass `dueDate` and it is computed. */
  grade?: DeadlineGrade;
  /** Due date the grade (and default label) is computed from. */
  dueDate?: Date | string;
  /** Reference date for computation — pass explicitly in tests for determinism. */
  now?: Date;
  children?: React.ReactNode;
}

/** Deadline pill. Grade escalates calmly: comfortable (neutral) → approaching (amber) → urgent (amber-red) → overdue (red). Tabular figures. */
export function DeadlineChip({ grade, dueDate, now, children }: DeadlineChipProps) {
  const ref = now ?? new Date();
  const resolved: DeadlineGrade =
    grade ?? (dueDate ? gradeFromDueDate(dueDate, ref) : "comfortable");
  const g = GRADE[resolved] || GRADE.comfortable;
  const label =
    children ?? (dueDate ? formatDeadline(dueDate, ref) : null);
  return (
    <span className={"fe-pill fe-tabular fe-deadline--" + resolved}>
      <span className="fe-icon" style={{ fontSize: 17 }} aria-hidden="true">
        {g.icon}
      </span>
      {label}
    </span>
  );
}
