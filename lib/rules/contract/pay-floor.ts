/**
 * Deterministic minimum-wage floor for an employment contract (CLAUDE.md Rule 1).
 *
 * This is pure rules code: identical inputs → identical outputs, no LLM. It is
 * the single source of truth for "does this pay meet the legal minimum?" and is
 * reused in three places:
 *   1. the contract questionnaire's live floor validation (FR-3.3),
 *   2. the Examiner's deterministic check #3 (P07),
 *   3. the April uprating re-check job (P09).
 *
 * Every rate comes from `getLiveConfig()` (Rule 4) — never hardcoded here. This
 * module only decides WHICH band applies and compares against the passed rate.
 *
 * The "Liam Carter gotcha": an apprentice is compared against the apprentice
 * band, which can legally sit below the 21+ NLW. Age-band derivation must follow
 * the apprentice rules, not blanket NLW.
 */
import type { StatutoryConfig } from "@/lib/config/types";

/** The four minimum-wage bands, keyed to `config.minimum_wage`. */
export type WageBandKey = "apprentice" | "nlw_21_plus" | "nmw_18_20" | "nmw_16_17";

export const WAGE_BAND_LABEL: Record<WageBandKey, string> = {
  apprentice: "apprentice",
  nlw_21_plus: "21 and over (National Living Wage)",
  nmw_18_20: "18 to 20",
  nmw_16_17: "16 to 17",
};

export interface WageBandInput {
  /** Date of birth, if known. */
  dob?: string | Date | null;
  /** Whether the hire is an apprentice. */
  isApprentice?: boolean;
  /** First day of the apprenticeship, if known — governs the first-year rule. */
  apprenticeshipStart?: string | Date | null;
  /** The date the band is assessed on (usually the employment start date). */
  on: string | Date;
}

export interface WageBandResult {
  band: WageBandKey;
  /** Plain-English reason the band was chosen (reading age 9). */
  reason: string;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value + (String(value).length === 10 ? "T00:00:00Z" : ""));
}

/** Whole years between `dob` and `on` (age last birthday). */
export function ageOn(dob: string | Date, on: string | Date): number {
  const b = toDate(dob);
  const d = toDate(on);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  const beforeBirthday =
    d.getUTCMonth() < b.getUTCMonth() ||
    (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** True if `on` falls within the first year of an apprenticeship starting `start`. */
function inFirstApprenticeshipYear(start: string | Date, on: string | Date): boolean {
  const s = toDate(start);
  const first = new Date(Date.UTC(s.getUTCFullYear() + 1, s.getUTCMonth(), s.getUTCDate()));
  return toDate(on).getTime() < first.getTime();
}

/**
 * Which minimum-wage band applies. Follows the NMW rules:
 * - Apprentices get the apprentice rate if they are under 19, OR (19+) still in
 *   their first year. After the first year, a 19+ apprentice moves to their age band.
 * - Otherwise by age on the assessment date: 21+ → NLW; 18–20; 16–17.
 *
 * When DOB is unknown the derivation stays safe (most protective): a non-apprentice
 * defaults to the 21+ NLW; an apprentice defaults to the apprentice band.
 */
export function deriveWageBand(input: WageBandInput): WageBandResult {
  const { dob, isApprentice, apprenticeshipStart, on } = input;
  const age = dob ? ageOn(dob, on) : null;

  if (isApprentice) {
    if (age !== null && age < 19) {
      return { band: "apprentice", reason: "An apprentice under 19 is paid the apprentice minimum wage." };
    }
    // 19+ apprentice, or age unknown: apprentice rate only while in the first year.
    const firstYear = apprenticeshipStart ? inFirstApprenticeshipYear(apprenticeshipStart, on) : true;
    if (firstYear) {
      return {
        band: "apprentice",
        reason: "An apprentice in the first year of their apprenticeship is paid the apprentice minimum wage.",
      };
    }
    // Past the first year and 19+ — fall through to the age band.
  }

  if (age === null) {
    return {
      band: "nlw_21_plus",
      reason: "Date of birth is not set, so the highest adult minimum wage is used to stay safe.",
    };
  }
  if (age >= 21) return { band: "nlw_21_plus", reason: "Aged 21 or over, so the National Living Wage applies." };
  if (age >= 18) return { band: "nmw_18_20", reason: "Aged 18 to 20, so the 18–20 minimum wage applies." };
  return { band: "nmw_16_17", reason: "Under 18, so the 16–17 minimum wage applies." };
}

export interface PayFloorInput {
  /** Gross hourly rate offered, in pounds. */
  hourlyRate: number;
  config: StatutoryConfig;
  band: WageBandInput;
}

export interface PayFloorResult {
  ok: boolean;
  /** The legal floor for the derived band, in pounds. */
  floor: number;
  band: WageBandKey;
  bandLabel: string;
  bandReason: string;
  /** Shortfall in pounds when `ok` is false, else 0. */
  shortfall: number;
}

/** The minimum-wage floor for a band, read from config (Rule 4). */
export function floorForBand(config: StatutoryConfig, band: WageBandKey): number {
  return config.minimum_wage[band];
}

/**
 * The pay-floor check. Compares the offered hourly rate against the floor for the
 * derived band. Rates are pounds; comparison is to the penny (a 1p shortfall fails).
 */
export function checkPayFloor(input: PayFloorInput): PayFloorResult {
  const { band, reason } = deriveWageBand(input.band);
  const floor = floorForBand(input.config, band);
  // Compare in whole pence to avoid binary float drift at the penny boundary.
  const ratePence = Math.round(input.hourlyRate * 100);
  const floorPence = Math.round(floor * 100);
  const ok = ratePence >= floorPence;
  return {
    ok,
    floor,
    band,
    bandLabel: WAGE_BAND_LABEL[band],
    bandReason: reason,
    shortfall: ok ? 0 : (floorPence - ratePence) / 100,
  };
}
