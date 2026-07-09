"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import {
  addDays,
  addWorkingDays,
  instantiateChecklist,
  isValidPayeReference,
  normalisePayeReference,
  pensionDeclarationDeadline,
  type StepState,
} from "@/lib/rules/setup";

async function ctx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");
  return { supabase, user, business };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Upsert the single obligation of a given type for a business. */
async function upsertObligation(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  type: string,
  patch: { state?: StepState; due_date?: string | null; evidence_id?: string | null; source?: string },
) {
  const { data: existing } = await supabase
    .from("obligations")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", type)
    .limit(1)
    .maybeSingle();
  if (existing) {
    await supabase.from("obligations").update(patch).eq("id", existing.id);
    return existing.id as string;
  }
  const { data: inserted } = await supabase
    .from("obligations")
    .insert({ business_id: businessId, type, source: "setup", ...patch })
    .select("id")
    .single();
  return inserted?.id as string;
}

async function mergeSetupState(
  supabase: ReturnType<typeof createClient>,
  business: { id: string; journey_state: Record<string, unknown> },
  patch: Record<string, unknown>,
) {
  const journey = { ...(business.journey_state ?? {}) };
  journey.setup = { ...((journey.setup as Record<string, unknown>) ?? {}), ...patch };
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);
}

const OBLIGATION_OF: Record<string, string> = Object.fromEntries(
  instantiateChecklist("limited").map((s) => [s.id, s.obligationType]),
);

/** Mark a setup step in progress. For HMRC, schedule the PAYE-ref reminder. */
export async function markStepInProgress(stepId: string): Promise<void> {
  const { supabase, business } = await ctx();
  const type = OBLIGATION_OF[stepId];
  const due = stepId === "hmrc_paye" ? addWorkingDays(todayIso(), 5) : null;
  await upsertObligation(supabase, business.id, type, { state: "in_progress", due_date: due });
  revalidatePath("/app/setup");
}

/** Capture and validate the PAYE reference; completes the HMRC step. */
export async function capturePayeReference(ref: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, business } = await ctx();
  if (!isValidPayeReference(ref)) {
    return { ok: false, error: "That doesn't look right. It should be three digits, a slash, then letters and numbers — e.g. 475/LW93401." };
  }
  const normalised = normalisePayeReference(ref);
  await mergeSetupState(supabase, business, { paye_ref: normalised });
  await upsertObligation(supabase, business.id, "hmrc_paye", { state: "complete", due_date: null });
  revalidatePath("/app/setup");
  return { ok: true };
}

/** Choose payroll software (completes the payroll step). */
export async function choosePayroll(providerId: string): Promise<void> {
  const { supabase, business } = await ctx();
  await mergeSetupState(supabase, business, { payroll_provider: providerId });
  await upsertObligation(supabase, business.id, "payroll", { state: "complete" });
  revalidatePath("/app/setup");
}

/**
 * Set up the pension: capture the duties start date on the employee, compute the
 * declaration-of-compliance deadline from config, and create the pension +
 * declaration obligations (the declaration carries the deadline — FR-2.4/5.2).
 */
export async function setupPension(providerId: string, dutiesStartIso: string): Promise<{ deadline: string }> {
  const { supabase, business } = await ctx();
  const config = await getLiveConfig();
  const deadline = pensionDeclarationDeadline(dutiesStartIso, config.values.pension.declaration_of_compliance_months);

  // Persist the duties start date on the (first) employee being onboarded.
  const { data: emp } = await supabase.from("employees").select("id").eq("business_id", business.id).limit(1).maybeSingle();
  if (emp) await supabase.from("employees").update({ start_date: dutiesStartIso }).eq("id", emp.id);

  await mergeSetupState(supabase, business, { pension_provider: providerId, duties_start: dutiesStartIso });
  await upsertObligation(supabase, business.id, "pension_enrolment", { state: "in_progress" });
  await upsertObligation(supabase, business.id, "pension_declaration", { state: "not_started", due_date: deadline });
  revalidatePath("/app/setup");
  revalidatePath("/app");
  return { deadline };
}

/**
 * Save the EL insurance certificate: upload to the evidence vault, record the
 * evidence + completed obligation, and set a renewal reminder (one month before
 * expiry).
 */
export async function saveInsurance(expiryIso: string, fileBase64: string, contentType: string): Promise<void> {
  const { supabase, user, business } = await ctx();
  const bytes = Buffer.from(fileBase64.split(",").pop() ?? "", "base64");
  const ext = contentType.includes("pdf") ? "pdf" : contentType.includes("png") ? "png" : "jpg";
  const path = `${business.id}/insurance/el-certificate-${Date.now()}.${ext}`;

  const svc = createServiceClient();
  const { error: upErr } = await svc.storage.from("evidence").upload(path, bytes, { contentType, upsert: true });
  if (upErr) throw new Error(`certificate upload failed: ${upErr.message}`);

  const { data: ev } = await supabase
    .from("evidence")
    .insert({
      business_id: business.id,
      type: "el_insurance_certificate",
      file_path: path,
      meta: { expiry_date: expiryIso },
      retention_class: "standard",
    })
    .select("id")
    .single();

  const renewalDue = addDays(
    // one month before expiry
    (function oneMonthBefore(iso: string) {
      const [y, m, d] = iso.split("-").map(Number);
      const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
      const dim = new Date(Date.UTC(prev.y, prev.m, 0)).getUTCDate();
      const day = Math.min(d, dim);
      return `${prev.y}-${String(prev.m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    })(expiryIso),
    0,
  );

  await upsertObligation(supabase, business.id, "el_insurance", {
    state: "complete",
    due_date: renewalDue,
    evidence_id: ev?.id ?? null,
  });
  await supabase.from("events").insert({
    business_id: business.id,
    actor_kind: "user",
    actor_id: user.id,
    action: "evidence.uploaded",
    entity: "evidence",
    entity_id: ev?.id ?? null,
    payload: { type: "el_insurance_certificate", expiry_date: expiryIso },
  });
  revalidatePath("/app/setup");
  revalidatePath("/app");
}

/** Complete a lightweight guidance step (ICO, H&S, records). */
export async function completeStep(stepId: string): Promise<void> {
  const { supabase, business } = await ctx();
  const type = OBLIGATION_OF[stepId];
  await upsertObligation(supabase, business.id, type, { state: "complete" });
  revalidatePath("/app/setup");
}
