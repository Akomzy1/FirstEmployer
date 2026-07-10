/**
 * True-cost-of-hiring calculator (Build Prompt 13 §4). Pure functions over
 * config (Rule 4): employer NI above the secondary threshold with the
 * Employment Allowance note, minimum employer pension contribution on
 * qualifying earnings, and the statutory floor check for the entered wage.
 * The EL insurance figure is a market ESTIMATE (commercial, not statutory).
 */
import type { StatutoryConfig } from "@/lib/config/types";
import { checkPayFloor, type WageBandInput } from "./contract/pay-floor";

export interface CostInput {
  hourlyRate: number;
  hoursPerWeek: number;
  band: WageBandInput;
}

export interface CostBreakdown {
  grossAnnual: number;
  /** Employer NI before the Employment Allowance. */
  employerNiBeforeAllowance: number;
  /** Employer NI after the allowance (a first employer usually pays £0 until the allowance is used). */
  employerNiAfterAllowance: number;
  employmentAllowance: number;
  pensionEmployerAnnual: number;
  /** Total annual cost with the allowance applied. */
  totalAnnual: number;
  totalMonthly: number;
  payFloorOk: boolean;
  payFloor: number;
  bandLabel: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateHiringCost(input: CostInput, config: StatutoryConfig): CostBreakdown {
  const grossAnnual = round2(input.hourlyRate * input.hoursPerWeek * 52);

  const ni = config.ni;
  const niBase = Math.max(0, grossAnnual - ni.secondary_threshold_annual);
  const employerNiBeforeAllowance = round2((niBase * ni.employer_rate_pct) / 100);
  const employerNiAfterAllowance = round2(Math.max(0, employerNiBeforeAllowance - ni.employment_allowance));

  const p = config.pension;
  const qualifying = Math.max(0, Math.min(grossAnnual, p.qualifying_band_upper) - p.qualifying_band_lower);
  const pensionEmployerAnnual =
    grossAnnual >= p.ae_earnings_trigger ? round2((qualifying * p.min_employer_contribution_pct) / 100) : 0;

  const floor = checkPayFloor({ hourlyRate: input.hourlyRate, config, band: input.band });

  const totalAnnual = round2(grossAnnual + employerNiAfterAllowance + pensionEmployerAnnual);
  return {
    grossAnnual,
    employerNiBeforeAllowance,
    employerNiAfterAllowance,
    employmentAllowance: ni.employment_allowance,
    pensionEmployerAnnual,
    totalAnnual,
    totalMonthly: round2(totalAnnual / 12),
    payFloorOk: floor.ok,
    payFloor: floor.floor,
    bandLabel: floor.bandLabel,
  };
}
