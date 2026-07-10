/**
 * Values interpolated into the ported marketing bodies. Prices come from
 * lib/pricing (the single price source, P03 convention); statutory figures come
 * from getLiveConfig (Rule 4) and are formatted server-side.
 */
import { getTier } from "@/lib/pricing";
import type { ResolvedConfig } from "@/lib/config";

export interface MarketingVars {
  starterPrice: string;
  launchPrice: string;
  growthPrice: string;
  /** RTW civil penalty, first breach, formatted without the £ (bodies carry the sign). */
  rtwPenalty: string;
  /** Config label for "rates current as of" badges. */
  configLabel: string;
  nlw: string;
}

export function marketingVars(config: ResolvedConfig): MarketingVars {
  return {
    starterPrice: getTier("starter").price,
    launchPrice: getTier("launch").price,
    growthPrice: getTier("growth").price,
    rtwPenalty: config.values.right_to_work.penalty_first_breach.toLocaleString("en-GB"),
    configLabel: config.label,
    nlw: config.values.minimum_wage.nlw_21_plus.toFixed(2),
  };
}
