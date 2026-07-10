/**
 * April uprating re-check (J4, P0 acceptance). Pure rules code.
 *
 * When a new config version goes live, every employee's pay is re-evaluated
 * against the NEW statutory floors. An employee paid at or above their band's
 * new floor is fine; one below it is flagged with the exact hourly gap, and the
 * fix is an examined variation letter (consolidated statement) at or above the
 * new floor. Reuses the single pay-floor source of truth (`checkPayFloor`).
 */
import type { StatutoryConfig } from "@/lib/config/types";
import { checkPayFloor, type WageBandKey } from "../contract/pay-floor";

export interface UpratingEmployeeInput {
  id: string;
  fullName: string;
  /** Short role/context line for the impact row (e.g. "Apprentice · under 19"). */
  roleLine?: string | null;
  dob?: string | null;
  isApprentice?: boolean;
  apprenticeshipStart?: string | null;
  /** Current gross hourly rate in pounds. Employees without hourly pay data are skipped. */
  hourlyRate: number | null;
}

export interface UpratingImpact {
  employeeId: string;
  name: string;
  roleLine: string;
  ok: boolean;
  band: WageBandKey;
  bandLabel: string;
  /** The employee's current rate, pounds. */
  rate: number;
  /** The NEW statutory floor for their band, pounds. */
  floor: number;
  /** Hourly shortfall in pounds when not ok, else 0. */
  gap: number;
  /** Plain-English impact line (reading age 9). */
  detail: string;
}

export interface UpratingResult {
  checked: number;
  flagged: UpratingImpact[];
  impacts: UpratingImpact[];
}

const gbp = (n: number) => "£" + n.toFixed(2);

/**
 * Re-check every employee against the new config's floors, effective `onDate`.
 * Deterministic; the job layer persists the flags, this computes them.
 */
export function recheckPayAgainstConfig(
  employees: UpratingEmployeeInput[],
  newConfig: StatutoryConfig,
  onDate: string,
): UpratingResult {
  const impacts: UpratingImpact[] = [];
  for (const e of employees) {
    if (e.hourlyRate == null) continue;
    const check = checkPayFloor({
      hourlyRate: e.hourlyRate,
      config: newConfig,
      band: { dob: e.dob, isApprentice: e.isApprentice, apprenticeshipStart: e.apprenticeshipStart, on: onDate },
    });
    const first = e.fullName.split(/\s+/)[0] || e.fullName;
    const detail = check.ok
      ? `The ${check.bandLabel} rate is now ${gbp(check.floor)}. ${first} is paid ${gbp(e.hourlyRate)} — ${first} is fine.`
      : `${first} is paid ${gbp(e.hourlyRate)} — that's now ${Math.round(check.shortfall * 100)}p/hour below the legal minimum of ${gbp(check.floor)}.`;
    impacts.push({
      employeeId: e.id,
      name: e.fullName,
      roleLine: e.roleLine ?? (e.isApprentice ? "Apprentice" : ""),
      ok: check.ok,
      band: check.band,
      bandLabel: check.bandLabel,
      rate: e.hourlyRate,
      floor: check.floor,
      gap: check.shortfall,
      detail,
    });
  }
  return { checked: impacts.length, flagged: impacts.filter((i) => !i.ok), impacts };
}
