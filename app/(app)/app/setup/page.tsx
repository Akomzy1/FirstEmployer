import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { deriveChecklistStates, instantiateChecklist, type StepState } from "@/lib/rules/setup";
import { SetupFlow } from "@/components/app/setup/SetupFlow";

export const metadata = { title: "Employer setup" };

function toStepState(obligationState: string | undefined): StepState {
  switch (obligationState) {
    case "complete": return "complete";
    case "blocked": return "blocked";
    case "not_started": case undefined: return "not_started";
    default: return "in_progress"; // in_progress / at_risk / overdue
  }
}

export default async function SetupPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");
  const supabase = createClient();

  const steps = instantiateChecklist(business.type);
  const { data: obligations } = await supabase.from("obligations").select("type, state, due_date");
  const stateByType = new Map((obligations ?? []).map((o) => [o.type, o.state]));
  const dueByType = new Map((obligations ?? []).map((o) => [o.type, o.due_date]));

  const recorded: Record<string, StepState> = {};
  for (const s of steps) recorded[s.id] = toStepState(stateByType.get(s.obligationType));
  const states = deriveChecklistStates(steps, recorded);
  const stepsWithState = steps.map((s) => ({ ...s, state: states[s.id] }));

  const { data: emp } = await supabase.from("employees").select("full_name, start_date").eq("business_id", business.id).limit(1).maybeSingle();

  const config = (await getLiveConfig()).values;
  const declarationDeadline = (dueByType.get("pension_declaration") as string | null) ?? null;

  return (
    <SetupFlow
      steps={stepsWithState}
      setupState={(business.journey_state?.setup as Record<string, string>) ?? {}}
      employeeName={emp?.full_name ?? "your new hire"}
      employeeStartDate={(emp?.start_date as string | null) ?? null}
      declarationDeadline={declarationDeadline}
      statutory={{
        elMinCover: config.insurance.el_min_cover,
        elPenaltyDay: config.insurance.el_penalty_per_day,
        elCertPenalty: config.insurance.el_certificate_display_penalty,
        pensionEmployerPct: config.pension.min_employer_contribution_pct,
        rtwPenalty: config.right_to_work.penalty_first_breach,
        lelWeekly: config.paye.lel_weekly,
        declarationMonths: config.pension.declaration_of_compliance_months,
        payRecordYears: config.employment_penalties.pay_record_retention_years,
      }}
    />
  );
}
