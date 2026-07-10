"use server";

import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { determineRtwRoute, toRtwResult, requiresFollowUp, rtwFollowUpSchedule, type RtwRoute, type RtwResultChoice } from "@/lib/rules/rtw";
import { renderRtwRecordPdf } from "@/lib/pdf/rtw-record";

export interface RecordRtwInput {
  employeeId: string;
  route: RtwRoute;
  whatChecked: string;
  checkedBy: string;
  checkedDate: string; // ISO YYYY-MM-DD
  result: RtwResultChoice;
  expiryDate?: string; // ISO, required when result === "time_limited"
  /** Downscaled JPEG data URL of the captured evidence photo, if any. */
  evidenceDataUrl?: string;
  isRecheck?: boolean;
  supersedesId?: string;
}

export interface RecordRtwResult {
  recordId: string;
  reference: string;
  result: "pass" | "follow_up_required" | "fail";
  method: string;
  whatChecked: string;
  checkedBy: string;
  checkedDateLabel: string;
  resultLabel: string;
  followUpDue: string | null;
  evidenceCount: number;
  isRecheck: boolean;
}

const METHOD_LABEL: Record<RtwRoute, string> = {
  manual: "Manual check",
  share_code: "Online check",
  employer_checking_service: "Home Office check",
};

async function loadContext() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");
  return { supabase, user, business };
}

function refFromId(id: string): string {
  const hex = createHash("sha256").update(id).digest("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], "base64") };
}

/**
 * Record a right to work check. Writes the IMMUTABLE rtw_records row, stores the
 * evidence photo + the statutory-excuse PDF in the vault, creates/updates the
 * follow-up obligation (time-limited permissions), and — on a re-check — links the
 * supersede chain without ever overwriting the prior record (CLAUDE.md Rule 5).
 */
export async function recordRtwCheck(input: RecordRtwInput): Promise<RecordRtwResult> {
  const { supabase, user, business } = await loadContext();
  const svc = createServiceClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("id", input.employeeId)
    .maybeSingle();
  if (!employee) throw new Error("employee not found");

  const rtwResult = toRtwResult(input.result);
  const followUpDue = input.result === "time_limited" ? input.expiryDate ?? null : null;
  const expiryDate = input.result === "time_limited" ? input.expiryDate ?? null : null;

  // 1) Store the evidence photo first (rtw_records is immutable, so evidence must
  //    be linked at insert time).
  const evidencePaths: string[] = [];
  let evidenceId: string | null = null;
  if (input.evidenceDataUrl) {
    const decoded = decodeDataUrl(input.evidenceDataUrl);
    if (decoded) {
      const { data: evRow, error: evErr } = await supabase
        .from("evidence")
        .insert({
          business_id: business.id,
          type: "rtw_photo",
          meta: { employee_id: employee.id, kind: "right_to_work_evidence" },
          retention_class: "rtw_employment_plus_2y",
        })
        .select("id")
        .single();
      if (evErr) throw new Error(`evidence insert failed: ${evErr.message}`);
      evidenceId = evRow.id;
      const ext = decoded.contentType.includes("png") ? "png" : "jpg";
      const path = `${business.id}/rtw/${evRow.id}/evidence.${ext}`;
      const { error: upErr } = await svc.storage.from("evidence").upload(path, decoded.buffer, {
        contentType: decoded.contentType,
        upsert: true,
      });
      if (upErr) throw new Error(`evidence upload failed: ${upErr.message}`);
      await supabase.from("evidence").update({ file_path: path }).eq("id", evRow.id);
      evidencePaths.push(path);
    }
  }

  // 2) The immutable check record.
  const { data: rec, error: recErr } = await supabase
    .from("rtw_records")
    .insert({
      employee_id: employee.id,
      route: input.route,
      checked_by: input.checkedBy,
      checked_at: input.checkedDate,
      result: rtwResult,
      evidence_id: evidenceId,
      evidence_paths: evidencePaths,
      expiry_date: expiryDate,
      follow_up_due: followUpDue,
      supersedes: input.isRecheck ? input.supersedesId ?? null : null,
    })
    .select("id")
    .single();
  if (recErr) throw new Error(`rtw_records insert failed: ${recErr.message}`);
  const reference = refFromId(rec.id);

  const method = METHOD_LABEL[input.route] ?? determineRtwRoute("outstanding_or_other").method;
  const checkedDateLabel = new Date(input.checkedDate + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const followUpLabel = followUpDue ? new Date(followUpDue + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null;
  const resultLabel =
    rtwResult === "pass" ? "Passed — permanent right to work"
      : rtwResult === "follow_up_required" ? `Passed — permission until ${followUpLabel}`
        : "Not permitted to work";

  // 3) The statutory-excuse PDF, deposited to the vault.
  const pdf = await renderRtwRecordPdf({
    businessName: business.name,
    personName: employee.full_name,
    method,
    whatChecked: input.whatChecked,
    checkedBy: input.checkedBy,
    checkedDate: checkedDateLabel,
    resultLabel,
    followUpDue: followUpLabel,
    evidenceCount: evidencePaths.length,
    reference,
  });
  const pdfPath = `${business.id}/rtw/${rec.id}/record.pdf`;
  const { error: pdfErr } = await svc.storage.from("evidence").upload(pdfPath, pdf, { contentType: "application/pdf", upsert: true });
  if (pdfErr) throw new Error(`rtw record pdf upload failed: ${pdfErr.message}`);
  await supabase.from("evidence").insert({
    business_id: business.id,
    type: "rtw_record",
    file_path: pdfPath,
    meta: { record_id: rec.id, reference, person: employee.full_name, result: rtwResult },
    retention_class: "rtw_employment_plus_2y",
  });

  // 4) Follow-up obligation + alert schedule (time-limited only). One obligation per
  //    employee: a re-check updates the same row to the new due date.
  const { data: existing } = await supabase
    .from("obligations")
    .select("id")
    .eq("business_id", business.id)
    .eq("employee_id", employee.id)
    .eq("type", "right_to_work")
    .maybeSingle();

  const obligationState = rtwResult === "fail" ? "blocked" : "complete";
  const dueDate = requiresFollowUp(rtwResult) ? followUpDue : null;
  const schedule = requiresFollowUp(rtwResult) && followUpDue ? rtwFollowUpSchedule(followUpDue) : null;
  const source = `rtw_record:${rec.id}`;

  if (existing) {
    await supabase.from("obligations").update({ state: obligationState, due_date: dueDate, source }).eq("id", existing.id);
  } else {
    await supabase.from("obligations").insert({
      business_id: business.id,
      employee_id: employee.id,
      type: "right_to_work",
      state: obligationState,
      due_date: dueDate,
      source,
    });
  }

  // 5) Audit event (append-only). Records the alert schedule for the follow-up.
  await supabase.from("events").insert({
    business_id: business.id,
    actor_kind: "user",
    actor_id: user.id,
    action: input.isRecheck ? "rtw.rechecked" : "rtw.recorded",
    entity: "rtw_record",
    entity_id: rec.id,
    payload: { route: input.route, result: rtwResult, reference, follow_up_due: followUpDue, alerts: schedule?.alerts ?? [], supersedes: input.supersedesId ?? null },
  });

  return {
    recordId: rec.id,
    reference,
    result: rtwResult,
    method,
    whatChecked: input.whatChecked,
    checkedBy: input.checkedBy,
    checkedDateLabel,
    resultLabel,
    followUpDue: followUpLabel,
    evidenceCount: evidencePaths.length,
    isRecheck: !!input.isRecheck,
  };
}

/* ------------------- save & resume (FR-8.6, P15) ------------------- */

export interface RtwDraft {
  view?: string;
  activeId?: string;
  route?: RtwRoute;
  whatChecked?: string;
  isRecheck?: boolean;
  checked?: number[];
  resultChoice?: "continuous" | "time_limited";
  expiry?: string;
  checker?: string;
  /** The evidence photo is deliberately NOT persisted server-side per step —
   *  it must be retaken with the person present after an interruption. */
}

/** Autosave the walkthrough draft into business.journey_state.rtw. */
export async function saveRtwDraft(patch: RtwDraft): Promise<void> {
  const { supabase, business } = await loadContext();
  const journey = { ...(business.journey_state ?? {}) };
  journey.rtw = { ...((journey.rtw as RtwDraft) ?? {}), ...patch };
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);
}

/** Clear the draft once the record is created. */
export async function clearRtwDraft(): Promise<void> {
  const { supabase, business } = await loadContext();
  const journey = { ...(business.journey_state ?? {}) };
  delete journey.rtw;
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);
}
