"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { getPrimaryEmployee, type EmployeeRow } from "@/lib/data/employee";
import { getLiveConfig } from "@/lib/config";
import { generateContract } from "@/lib/ai/generator";
import { makeExaminer } from "@/lib/ai/examiner";
import { runGeneration } from "@/lib/documents/pipeline";
import { assertCanGenerate, type TierId } from "@/lib/tiers";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import type { ContractFacts } from "@/lib/templates/contract/types";
import type { ExamCheckView, GenerationResultView } from "@/lib/documents/view";

export interface ContractForm {
  jobTitle: string;
  duties: string;
  place: string;
  rate: string;
  hours: string;
  interval: "Weekly" | "Fortnightly" | "Monthly";
  start: string;
  probation: string;
  notice: string;
  holiday: string;
  sickPay: "ssp" | "company";
  pension: "nest" | "other";
}

async function loadContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");
  const employee = await getPrimaryEmployee(business.id);
  if (!employee) throw new Error("no employee to contract");
  return { supabase, user, business, employee };
}

function buildFacts(
  business: { name: string; type: "sole_trader" | "limited" },
  employee: EmployeeRow,
  form: ContractForm,
): ContractFacts {
  return {
    employerName: business.name,
    employerType: business.type,
    employeeName: employee.full_name,
    wageBand: {
      dob: employee.dob,
      isApprentice: employee.is_apprentice,
      apprenticeshipStart: employee.apprenticeship_start,
      on: form.start || employee.start_date || new Date().toISOString().slice(0, 10),
    },
    jobTitle: form.jobTitle.trim(),
    duties: form.duties.trim(),
    place: form.place.trim(),
    hourlyRate: parseFloat(form.rate),
    weeklyHours: parseFloat(form.hours),
    payInterval: form.interval,
    startDate: form.start,
    probation: form.probation,
    notice: form.notice,
    holidayDays: parseInt(form.holiday, 10),
    daysPerWeek: 5,
    sickPay: form.sickPay,
    pension: form.pension,
  };
}

/** Autosave the questionnaire draft into journey_state.contract (FR-8.6). */
export async function saveContractDraft(patch: Partial<ContractForm>): Promise<void> {
  const { supabase, business } = await loadContext();
  const journey = { ...(business.journey_state ?? {}) };
  const prev = (journey.contract as Partial<ContractForm>) ?? {};
  journey.contract = { ...prev, ...patch };
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);
}

/**
 * Generate + examine a contract through the fail-closed pipeline, and return a
 * serialisable result for the progress screen. The examiner is stubbed in P06;
 * P07 swaps in the real independent examiner without changing this action.
 */
export async function generateContractAction(form: ContractForm): Promise<GenerationResultView> {
  const { supabase, user, business, employee } = await loadContext();

  // Generation gate: tier must include the journey and the subscription must be
  // live (lapsed accounts are read-only — documents stay downloadable).
  assertCanGenerate({ tier: business.tier as TierId, subscription_state: business.subscription_state, trial_ends_at: business.trial_ends_at });

  const config = await getLiveConfig();
  const facts = buildFacts(business, employee, form);

  const store = createSupabaseDocumentStore({
    db: supabase,
    storage: createServiceClient(),
    businessId: business.id,
    employeeId: employee.id,
    actorId: user.id,
  });

  const result = await runGeneration({
    businessId: business.id,
    employeeId: employee.id,
    facts,
    config: config.values,
    configLabel: config.label,
    questionnaire: { ...form },
    generate: (f, c, opts) => generateContract(f, c, opts),
    examine: makeExaminer(),
    store,
  });

  // Clear the draft now the document exists.
  const journey = { ...(business.journey_state ?? {}) };
  delete journey.contract;
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);

  const last = result.examinations[result.examinations.length - 1];
  const finalChecks: ExamCheckView[] = last.checks.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    statutoryRef: c.statutoryRef,
    detail: c.detail,
  }));
  const firstFail = result.examinations[0].checks.find((c) => c.status === "fail");
  const firstDefect = result.examinations[0].defects[0];
  const nowLabel = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    documentId: result.documentId,
    status: result.status,
    outcome: result.outcome,
    attempts: result.attempts,
    finalChecks,
    firstFailCheckId: firstFail?.id,
    defect: firstDefect
      ? { issue: firstDefect.issue, statutoryBasis: firstDefect.statutoryBasis, clauseRef: firstDefect.clauseRef }
      : undefined,
    seal:
      result.status === "approved"
        ? { timestamp: nowLabel, hash: last.checklistHash }
        : undefined,
    employeeName: employee.full_name,
  };
}
