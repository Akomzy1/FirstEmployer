/**
 * Right to Work follow-up date math (FR-4.4). Pure, deterministic (CLAUDE.md Rule 1).
 *
 * When a check gives a TIME-LIMITED permission, a follow-up check must be completed
 * before the permission expires. The follow-up is due on the expiry date, and the
 * user is reminded 90, 30 and 7 days before.
 *
 * ALERT SCHEDULE — 90/30/7 (PRD FR-4.4 and journey J2). This resolves the conflict
 * flagged at P02: CLAUDE.md testing-gate 3 said "60/30/7", but the PRD is the
 * authority on behaviour (CLAUDE.md §1), and both FR-4.4 and J2 say 90/30/7. The
 * general-obligation alert ladder (30/14/7/1, FR-5.3) is separate and belongs to
 * the dashboard. These are UX schedule constants, deliberately NOT in statutory config.
 */
export const RTW_ALERT_OFFSETS_DAYS = [90, 30, 7] as const;

/** Add `days` (can be negative) to an ISO date (YYYY-MM-DD), in UTC. */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface RtwAlert {
  daysBefore: number;
  /** ISO date the reminder should fire. */
  date: string;
}

export interface RtwFollowUpSchedule {
  /** The date the follow-up check must be completed by (= expiry). */
  followUpDue: string;
  alerts: RtwAlert[];
}

/**
 * The follow-up schedule for a time-limited permission expiring on `expiryIso`.
 * Alerts before the expiry date, earliest first.
 */
export function rtwFollowUpSchedule(expiryIso: string): RtwFollowUpSchedule {
  return {
    followUpDue: expiryIso,
    alerts: RTW_ALERT_OFFSETS_DAYS.map((daysBefore) => ({
      daysBefore,
      date: addDays(expiryIso, -daysBefore),
    })).sort((a, b) => (a.date < b.date ? -1 : 1)),
  };
}

/** True when the result requires a follow-up check (time-limited permission). */
export function requiresFollowUp(result: "pass" | "follow_up_required" | "fail"): boolean {
  return result === "follow_up_required";
}
