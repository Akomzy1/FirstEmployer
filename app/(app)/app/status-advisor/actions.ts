"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { determineStatus, VERDICT_LABEL, type StatusAnswers } from "@/lib/rules/status";
import { renderDeterminationPdf } from "@/lib/pdf/determination";
import { assertCanAddEmployee, type TierId } from "@/lib/tiers";

interface StatusDraft {
  employeeId?: string;
  name?: string;
  step?: string;
  answers?: StatusAnswers;
  ambiguousAcknowledged?: boolean;
}

async function loadContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");
  return { supabase, user, business };
}

/** Create the prospective hire being assessed, and open the draft. */
export async function startStatusAdvisor(name: string): Promise<{ employeeId: string }> {
  const { supabase, business } = await loadContext();

  // Tier gate (server-side, single module — CLAUDE.md working rules).
  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  assertCanAddEmployee(
    { tier: business.tier as TierId, subscription_state: business.subscription_state, trial_ends_at: business.trial_ends_at },
    count ?? 0,
  );

  const { data: emp, error } = await supabase
    .from("employees")
    .insert({ business_id: business.id, full_name: name.trim(), status: "prospective" })
    .select("id")
    .single();
  if (error) throw new Error(`create employee failed: ${error.message}`);

  await mergeDraft(supabase, business, { employeeId: emp.id, name: name.trim(), step: "q0", answers: {} });
  return { employeeId: emp.id };
}

/** Autosave the questionnaire draft into business.journey_state.status_advisor (FR-8.6). */
export async function saveStatusDraft(patch: StatusDraft): Promise<void> {
  const { supabase, business } = await loadContext();
  await mergeDraft(supabase, business, patch);
}

async function mergeDraft(
  supabase: ReturnType<typeof createClient>,
  business: { id: string; journey_state: Record<string, unknown> },
  patch: StatusDraft,
) {
  const journey = { ...(business.journey_state ?? {}) };
  const prev = (journey.status_advisor as StatusDraft) ?? {};
  journey.status_advisor = { ...prev, ...patch, answers: { ...(prev.answers ?? {}), ...(patch.answers ?? {}) } };
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);
}

/** Record the ambiguous-outcome acknowledgement as an immutable event (FR-1.5). */
export async function acknowledgeAmbiguous(verdict: string, confidence: string): Promise<void> {
  const { supabase, user, business } = await loadContext();
  const draft = (business.journey_state?.status_advisor as StatusDraft) ?? {};
  await supabase.from("events").insert({
    business_id: business.id,
    actor_kind: "user",
    actor_id: user.id,
    action: "status.ambiguous_acknowledged",
    entity: "status_advisor",
    entity_id: draft.employeeId ?? null,
    payload: { verdict, confidence, employee_name: draft.name ?? null },
  });
  await mergeDraft(supabase, business, { ambiguousAcknowledged: true });
}

/**
 * Compute the determination (authoritative, deterministic), render + store the
 * PDF, and write the immutable determinations row + evidence + event.
 */
export async function recordDetermination(): Promise<{ id: string; reference: string }> {
  const { supabase, user, business } = await loadContext();
  const draft = (business.journey_state?.status_advisor as StatusDraft) ?? {};
  if (!draft.employeeId || !draft.answers) throw new Error("no status draft to record");

  const name = draft.name ?? "your new hire";
  const det = determineStatus(draft.answers, name);

  const { data: reference, error: refErr } = await supabase.rpc("mint_determination_reference");
  if (refErr || !reference) throw new Error(`mint reference failed: ${refErr?.message}`);

  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const pdf = await renderDeterminationPdf({
    reference,
    dateStr,
    businessName: business.name,
    subjectName: name,
    verdict: det.verdict,
    verdictLabel: VERDICT_LABEL[det.verdict],
    confidence: det.confidence,
    reasoning: det.reasoning,
    factors: det.factors,
    rulesVersion: det.rules_version,
    ambiguousAcknowledged: !!draft.ambiguousAcknowledged,
  });

  const path = `${business.id}/determinations/${reference}.pdf`;
  const svc = createServiceClient();
  const { error: upErr } = await svc.storage.from("evidence").upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) throw new Error(`pdf upload failed: ${upErr.message}`);

  const { data: detRow, error: detErr } = await supabase
    .from("determinations")
    .insert({
      employee_id: draft.employeeId,
      answers: draft.answers,
      verdict: det.verdict,
      confidence_band: det.confidence,
      factors: det.factors,
      rules_version: det.rules_version,
      reference,
      pdf_path: path,
    })
    .select("id")
    .single();
  if (detErr) throw new Error(`determination insert failed: ${detErr.message}`);

  await supabase.from("evidence").insert({
    business_id: business.id,
    type: "determination",
    file_path: path,
    meta: { reference, determination_id: detRow.id, verdict: det.verdict },
    retention_class: "standard",
  });
  await supabase.from("events").insert({
    business_id: business.id,
    actor_kind: "user",
    actor_id: user.id,
    action: "determination.created",
    entity: "determination",
    entity_id: detRow.id,
    payload: { reference, verdict: det.verdict, confidence: det.confidence },
  });

  // Clear the draft now the determination is recorded.
  const journey = { ...(business.journey_state ?? {}) };
  delete journey.status_advisor;
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);

  return { id: detRow.id, reference };
}
