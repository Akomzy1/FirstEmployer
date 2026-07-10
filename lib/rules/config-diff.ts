/**
 * Config version diff (P14). Pure: flattens two config value trees into
 * per-key old→new rows — what the publisher's diff view and publish modal show.
 */
import type { StatutoryConfig } from "@/lib/config/types";

export interface ConfigDiffRow {
  key: string;
  path: string;
  from: string;
  to: string;
  changed: boolean;
}

const LABELS: Record<string, string> = {
  "minimum_wage.nlw_21_plus": "National Living Wage (21+)",
  "minimum_wage.nmw_18_20": "NMW 18–20 band",
  "minimum_wage.nmw_16_17": "NMW 16–17 band",
  "minimum_wage.apprentice": "Apprentice rate",
  "holiday.statutory_weeks": "Statutory holiday (weeks)",
  "holiday.pay_record_retention_years": "Holiday record retention (years)",
  "pension.ae_earnings_trigger": "Auto-enrolment earnings trigger",
  "pension.qualifying_band_lower": "AE qualifying band — lower",
  "pension.qualifying_band_upper": "AE qualifying band — upper",
  "pension.min_total_contribution_pct": "AE minimum total contribution (%)",
  "pension.min_employer_contribution_pct": "AE minimum employer contribution (%)",
  "pension.declaration_of_compliance_months": "Declaration of compliance (months)",
  "insurance.el_min_cover": "EL minimum cover",
  "insurance.el_penalty_per_day": "EL penalty per day",
  "insurance.el_certificate_display_penalty": "EL certificate display penalty",
  "ni.employer_rate_pct": "Employer NI rate (%)",
  "ni.secondary_threshold_annual": "Employer NI secondary threshold",
  "ni.employment_allowance": "Employment Allowance",
  "paye.lel_weekly": "PAYE Lower Earnings Limit (weekly)",
  "ssp.day_one": "SSP from day one",
  "right_to_work.penalty_first_breach": "RTW penalty — first breach",
  "right_to_work.penalty_repeat_breach": "RTW penalty — repeat breach",
  "employment_penalties.tpr_auto_enrolment_fixed": "TPR fixed penalty",
  "employment_penalties.written_statement_tribunal_weeks": "Written statement tribunal (weeks' pay)",
  "employment_penalties.pay_record_retention_years": "Pay record retention (years)",
};

function flatten(obj: Record<string, unknown>, prefix = ""): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v as Record<string, unknown>, path).forEach((cv, ck) => out.set(ck, cv));
    } else {
      out.set(path, v);
    }
  }
  return out;
}

const fmt = (path: string, v: unknown): string => {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    const isMoney = /wage|apprentice|trigger|band|cover|penalty|allowance|threshold|lel/.test(path) && !/pct|weeks|months|years/.test(path);
    return isMoney ? "£" + v.toLocaleString("en-GB", { minimumFractionDigits: v % 1 ? 2 : 0 }) : String(v);
  }
  return String(v ?? "—");
};

/** Per-key diff of two config value trees, changed keys first. */
export function diffConfigs(from: StatutoryConfig, to: StatutoryConfig): ConfigDiffRow[] {
  const a = flatten(from as unknown as Record<string, unknown>);
  const b = flatten(to as unknown as Record<string, unknown>);
  const paths = Array.from(new Set([...Array.from(a.keys()), ...Array.from(b.keys())])).sort();
  return paths
    .map((path) => {
      const fromV = a.get(path);
      const toV = b.get(path);
      return {
        key: LABELS[path] ?? path,
        path,
        from: fmt(path, fromV),
        to: fmt(path, toV),
        changed: JSON.stringify(fromV) !== JSON.stringify(toV),
      };
    })
    .sort((x, y) => Number(y.changed) - Number(x.changed) || x.path.localeCompare(y.path));
}
