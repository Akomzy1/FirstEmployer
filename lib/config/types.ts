/** Statutory configuration shape. Mirrors config_versions.values (PRD Appendix B). */
export interface StatutoryConfig {
  minimum_wage: {
    /** National Living Wage, 21+. */
    nlw_21_plus: number;
    nmw_18_20: number;
    nmw_16_17: number;
    /** Apprentice rate (first-year apprentices of any age, and under-19s). */
    apprentice: number;
  };
  holiday: {
    statutory_weeks: number;
    pay_record_retention_years: number;
  };
  pension: {
    ae_earnings_trigger: number;
    qualifying_band_lower: number;
    qualifying_band_upper: number;
    min_total_contribution_pct: number;
    min_employer_contribution_pct: number;
    /** Declaration of compliance due this many months after duties start. */
    declaration_of_compliance_months: number;
  };
  insurance: {
    el_min_cover: number;
    el_penalty_per_day: number;
  };
  ssp: {
    day_one: boolean;
  };
  right_to_work: {
    penalty_first_breach: number;
    penalty_repeat_breach: number;
  };
}

export type ConfigStatus = "draft" | "scheduled" | "live" | "superseded";

/** A single versioned statutory snapshot, as stored in config_versions. */
export interface StatutoryConfigVersion {
  label: string;
  /** ISO date (YYYY-MM-DD) the version takes statutory effect. */
  effective_from: string;
  status: ConfigStatus;
  audit_note?: string;
  values: StatutoryConfig;
}

/** Result of resolving the config live at a given date. */
export interface ResolvedConfig {
  label: string;
  effectiveFrom: string;
  values: StatutoryConfig;
}
