"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { makeExaminer } from "@/lib/ai/examiner";
import { runGeneration } from "@/lib/documents/pipeline";
import { createSupabaseDocumentStore } from "@/lib/documents/supabase-store";
import { renderVariationLetter } from "@/lib/templates/contract/variation";
import { checkPayFloor } from "@/lib/rules/contract/pay-floor";
import type { ContractFacts } from "@/lib/templates/contract/types";
import { assertCanGenerate, type TierId } from "@/lib/tiers";
import { consumeToken, AI_LIMITS } from "@/lib/security/rate-limit";

export interface VariationResult {
  documentId: string;
  status: "approved" | "human_review";
}

/**
 * J4's one-tap fix: generate an examined variation letter (consolidated
 * statement) raising a flagged employee's pay to the new statutory floor.
 * Runs the SAME fail-closed pipeline as every other document; on approval the
 * employee's pay is updated, the old statement is superseded, and the
 * minimum_wage obligation returns green.
 */
export async function generateVariationLetter(employeeId: string): Promise<VariationResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");

  // Variation letters run the generation pipeline — same gate as contracts.
  assertCanGenerate({ tier: business.tier as TierId, subscription_state: business.subscription_state, trial_ends_at: business.trial_ends_at });
  consumeToken(`${business.id}:generation`, AI_LIMITS.generation);

  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, dob, is_apprentice, apprenticeship_start, start_date, pay_amount, pay_period, weekly_hours")
    .eq("id", employeeId)
    .single();
  if (!employee) throw new Error("employee not found");
  if (employee.pay_period !== "hourly" || employee.pay_amount == null) {
    throw new Error("this employee has no hourly pay to vary");
  }

  const config = await getLiveConfig();
  const today = new Date().toISOString().slice(0, 10);
  const previousRate = Number(employee.pay_amount);
  const band = {
    dob: employee.dob,
    isApprentice: employee.is_apprentice,
    apprenticeshipStart: employee.apprenticeship_start,
    on: config.effectiveFrom > today ? config.effectiveFrom : today,
  };
  const floorCheck = checkPayFloor({ hourlyRate: previousRate, config: config.values, band });
  if (floorCheck.ok) throw new Error("pay already meets the current minimum — no variation needed");
  const newRate = floorCheck.floor;

  // The latest approved statement this variation supersedes, if any.
  const { data: prior } = await supabase
    .from("documents")
    .select("id, questionnaire")
    .eq("business_id", business.id)
    .eq("employee_id", employee.id)
    .eq("status", "approved")
    .in("type", ["employment_contract", "variation_letter"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const priorQ = (prior?.questionnaire ?? {}) as Record<string, string>;

  const facts: ContractFacts = {
    employerName: business.name,
    employerType: business.type,
    employeeName: employee.full_name,
    wageBand: band,
    jobTitle: priorQ.jobTitle || "their current role",
    duties: priorQ.duties || "The duties stay exactly as before.",
    place: priorQ.place || "The place of work stays exactly as before.",
    hourlyRate: newRate,
    weeklyHours: Number(employee.weekly_hours ?? 40),
    payInterval: (priorQ.interval as ContractFacts["payInterval"]) || "Monthly",
    startDate: employee.start_date ?? today,
    probation: priorQ.probation || "None",
    notice: priorQ.notice || "1 week",
    holidayDays: parseInt(priorQ.holiday || "", 10) || 28,
    daysPerWeek: 5,
    sickPay: (priorQ.sickPay as ContractFacts["sickPay"]) || "ssp",
    pension: (priorQ.pension as ContractFacts["pension"]) || "nest",
  };

  const reason = "The National Living Wage went up, and the law says pay can never be below the minimum for your age or apprentice band.";
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
    questionnaire: { ...priorQ, rate: newRate.toFixed(2), reason: "uprating" },
    documentType: "variation_letter",
    supersedes: prior?.id ?? null,
    // Variation letters draft from the solicitor variation baseline directly —
    // deterministic, and the examiner gates it like everything else. (Claude
    // re-expression of variations can layer on later without changing this path.)
    generate: async (f, c) =>
      renderVariationLetter({ facts: f, previousRate, effectiveFrom: config.effectiveFrom, reason }, c),
    examine: makeExaminer(),
    store,
  });

  if (result.status === "approved") {
    // The variation is law now: update the employee's pay and clear the flag.
    await supabase.from("employees").update({ pay_amount: newRate }).eq("id", employee.id);
    const { data: minWage } = await supabase
      .from("obligations")
      .select("id")
      .eq("business_id", business.id)
      .eq("type", "minimum_wage")
      .maybeSingle();
    if (minWage) {
      await supabase.from("obligations").update({ state: "complete", document_id: result.documentId }).eq("id", minWage.id);
    }
    await supabase.from("events").insert({
      business_id: business.id,
      actor_kind: "user",
      actor_id: user.id,
      action: "variation.approved",
      entity: "document",
      entity_id: result.documentId,
      payload: { employee_id: employee.id, previous_rate: previousRate, new_rate: newRate, config_version: config.label },
    });
  }

  return { documentId: result.documentId, status: result.status };
}
