"use server";

import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/service";
import { runUpratingRecheck } from "@/lib/jobs/uprating";

/**
 * Publish a config version (P14 §3): the ONLY write path to config_versions.
 * Guarded by the allowlist, the SQL function enforces the audit note and writes
 * the append-only event; publishing then schedules the uprating re-check (J4).
 */
export async function publishConfigAction(versionId: string, auditNote: string): Promise<{ upratingFlagged: number }> {
  const admin = await requireAdmin();
  const svc = createServiceClient();

  const { error } = await svc.rpc("publish_config_version", {
    p_version_id: versionId,
    p_audit_note: auditNote,
    p_actor_id: admin.id,
    p_actor_email: admin.email,
  });
  if (error) throw new Error(error.message);

  // Publishing schedules the uprating job (Prompt 9's J4 pipeline).
  const summary = await runUpratingRecheck();
  return { upratingFlagged: summary.employeesFlagged };
}

/** Log a source change into the monitor review queue (manual entry for now). */
export async function addMonitorFinding(input: {
  source: string;
  url?: string;
  classification: "relevant" | "not-relevant";
  removed?: string;
  added?: string;
  proposalKind: "config" | "template" | "none";
  proposalTarget?: string;
  proposalChange?: string;
  proposalNote?: string;
}): Promise<{ id: string }> {
  await requireAdmin();
  const svc = createServiceClient();
  const diff = [
    ...(input.removed ? [{ type: "del", text: input.removed }] : []),
    ...(input.added ? [{ type: "add", text: input.added }] : []),
  ];
  const { data, error } = await svc
    .from("monitor_findings")
    .insert({
      source: input.source,
      url: input.url ?? null,
      classification: input.classification,
      diff,
      proposal: { kind: input.proposalKind, target: input.proposalTarget, change: input.proposalChange, note: input.proposalNote },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

/**
 * Resolve a monitor finding. Approving a config-kind proposal creates a DRAFT
 * config version cloned from live (to be edited + published separately) —
 * nothing ever auto-publishes.
 */
export async function resolveMonitorFinding(id: string, resolution: "approved" | "dismissed"): Promise<{ draftId: string | null }> {
  const admin = await requireAdmin();
  const svc = createServiceClient();

  const { data: finding } = await svc.from("monitor_findings").select("*").eq("id", id).single();
  if (!finding) throw new Error("finding not found");
  if (finding.state !== "pending") throw new Error("already resolved");

  let draftId: string | null = null;
  const proposal = (finding.proposal ?? {}) as { kind?: string };
  if (resolution === "approved" && proposal.kind === "config") {
    const { data: live } = await svc.from("config_versions").select("label, values").eq("status", "live").single();
    if (live) {
      const draftLabel = `${live.label}-draft-${Date.now().toString(36)}`;
      const { data: draft, error } = await svc
        .from("config_versions")
        .insert({
          label: draftLabel,
          effective_from: new Date().toISOString().slice(0, 10),
          status: "draft",
          values: live.values,
          audit_note: `Draft created from monitor finding ${finding.source}. Edit values, then publish with a full audit note.`,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      draftId = draft.id;
    }
  }

  await svc
    .from("monitor_findings")
    .update({ state: resolution, reviewed_by: admin.email, reviewed_at: new Date().toISOString(), created_config_version_id: draftId })
    .eq("id", id);

  return { draftId };
}
