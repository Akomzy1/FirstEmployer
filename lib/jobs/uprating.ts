/**
 * The April uprating job (J4). Runs when a config version becomes live: every
 * business's employees are re-checked against the NEW statutory floors (pure
 * rules), and where pay has fallen below a floor the business gets:
 *   - an at_risk `minimum_wage` obligation (turns the dashboard red), and
 *   - an append-only `config.uprating_checked` event carrying the per-employee
 *     impact — the dashboard renders its legal-change card from this.
 * Where nothing is wrong, the event still records the clean check (evidence by
 * default). Publishing is P14's job; this function is idempotent per config label.
 */
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getLiveConfig } from "@/lib/config";
import { recheckPayAgainstConfig, type UpratingEmployeeInput, type UpratingImpact } from "@/lib/rules/obligations/uprating";

export interface UpratingRunSummary {
  configLabel: string;
  businessesChecked: number;
  employeesChecked: number;
  businessesFlagged: number;
  employeesFlagged: number;
}

interface EmployeeRow {
  id: string;
  business_id: string;
  full_name: string;
  dob: string | null;
  is_apprentice: boolean;
  apprenticeship_start: string | null;
  pay_amount: number | null;
  pay_period: string | null;
  status: string;
}

/** Re-evaluate every business against the config live on `onDate`. Service-role:
 *  this is a system job crossing tenants, not a user request. */
export async function runUpratingRecheck(onDate?: string): Promise<UpratingRunSummary> {
  const svc = createServiceClient();
  const config = await getLiveConfig(onDate);
  const effective = onDate ?? config.effectiveFrom;

  const { data: employees, error } = await svc
    .from("employees")
    .select("id, business_id, full_name, dob, is_apprentice, apprenticeship_start, pay_amount, pay_period, status")
    .neq("status", "left");
  if (error) throw new Error(`uprating: employees load failed: ${error.message}`);

  const byBusiness = new Map<string, EmployeeRow[]>();
  for (const e of (employees ?? []) as EmployeeRow[]) {
    const list = byBusiness.get(e.business_id) ?? [];
    list.push(e);
    byBusiness.set(e.business_id, list);
  }

  let employeesChecked = 0;
  let employeesFlagged = 0;
  let businessesFlagged = 0;

  for (const [businessId, rows] of Array.from(byBusiness.entries())) {
    const inputs: UpratingEmployeeInput[] = rows.map((e) => ({
      id: e.id,
      fullName: e.full_name,
      roleLine: e.is_apprentice ? "Apprentice" : null,
      dob: e.dob,
      isApprentice: e.is_apprentice,
      apprenticeshipStart: e.apprenticeship_start,
      // Only hourly pay is compared against an hourly floor; salaried employees
      // need an hours-based derivation that lands with payroll depth (P1).
      hourlyRate: e.pay_period === "hourly" && e.pay_amount != null ? Number(e.pay_amount) : null,
    }));
    const result = recheckPayAgainstConfig(inputs, config.values, effective);
    employeesChecked += result.checked;

    if (result.flagged.length > 0) {
      businessesFlagged += 1;
      employeesFlagged += result.flagged.length;
      await upsertMinimumWageObligation(svc, businessId, "at_risk");
    } else if (result.checked > 0) {
      // A previously flagged business whose pay is now fine returns to green.
      await resolveMinimumWageIfClean(svc, businessId);
    }

    if (result.checked > 0) {
      await svc.from("events").insert({
        business_id: businessId,
        actor_kind: "system",
        actor_id: null,
        action: "config.uprating_checked",
        entity: "config_version",
        entity_id: null,
        payload: {
          config_label: config.label,
          effective_from: config.effectiveFrom,
          impacts: result.impacts satisfies UpratingImpact[],
          flagged: result.flagged.length,
        },
      });
    }
  }

  return {
    configLabel: config.label,
    businessesChecked: byBusiness.size,
    employeesChecked,
    businessesFlagged,
    employeesFlagged,
  };
}

async function upsertMinimumWageObligation(
  svc: ReturnType<typeof createServiceClient>,
  businessId: string,
  state: "at_risk" | "complete",
) {
  const { data: existing } = await svc
    .from("obligations")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", "minimum_wage")
    .maybeSingle();
  if (existing) {
    await svc.from("obligations").update({ state, source: "uprating_job" }).eq("id", existing.id);
  } else {
    await svc.from("obligations").insert({
      business_id: businessId,
      type: "minimum_wage",
      state,
      source: "uprating_job",
    });
  }
}

async function resolveMinimumWageIfClean(svc: ReturnType<typeof createServiceClient>, businessId: string) {
  const { data: existing } = await svc
    .from("obligations")
    .select("id, state")
    .eq("business_id", businessId)
    .eq("type", "minimum_wage")
    .maybeSingle();
  if (existing && existing.state !== "complete") {
    await svc.from("obligations").update({ state: "complete", source: "uprating_job" }).eq("id", existing.id);
  }
}
