/**
 * Deterministic statutory-holiday floor (CLAUDE.md Rule 1).
 *
 * The Working Time Regulations 1998 give a statutory number of weeks' paid
 * holiday a year, capped at the full-time-week equivalent. That statutory weeks
 * figure lives in config (`holiday.statutory_weeks`, Rule 4) — never hardcoded
 * here. This module turns it into a days floor for a given working pattern and
 * checks an entered figure against it. Reused by the questionnaire and Examiner.
 */
import type { StatutoryConfig } from "@/lib/config/types";

/** The statutory cap in days a week's entitlement counts towards (5-day week). */
const FULL_TIME_DAYS_PER_WEEK = 5;

/**
 * The statutory holiday floor in days for a working pattern. `daysPerWeek`
 * defaults to full-time (5), giving the full-time floor (statutory weeks × 5).
 * More than 5 days a week is capped at the full-time entitlement.
 */
export function holidayFloorDays(config: StatutoryConfig, daysPerWeek?: number | null): number {
  const weeks = config.holiday.statutory_weeks;
  const fullTimeCap = weeks * FULL_TIME_DAYS_PER_WEEK;
  if (daysPerWeek == null) return Math.round(fullTimeCap);
  const capped = Math.min(daysPerWeek, FULL_TIME_DAYS_PER_WEEK);
  return Math.round(weeks * capped);
}

export interface HolidayFloorResult {
  ok: boolean;
  /** The statutory floor in days for the working pattern. */
  floor: number;
  shortfall: number;
}

/** Check entered annual holiday days against the statutory floor. */
export function checkHolidayFloor(
  config: StatutoryConfig,
  enteredDays: number,
  daysPerWeek?: number | null,
): HolidayFloorResult {
  const floor = holidayFloorDays(config, daysPerWeek);
  const ok = enteredDays >= floor;
  return { ok, floor, shortfall: ok ? 0 : floor - enteredDays };
}
