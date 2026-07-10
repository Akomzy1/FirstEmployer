"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { loadVault } from "@/lib/data/vault";
import { scopeArtefacts, AUDIT_PRESETS, type AuditPresetId } from "@/lib/rules/audit-pack";
import { buildAuditBundle } from "@/lib/documents/audit-pack";

export interface ExportPackResult {
  downloadUrl: string;
  fileName: string;
  included: number;
  skipped: number;
  pageCount: number;
  generatedLabel: string;
}

/** Build the audit-pack bundle, deposit it to the vault, and return a short-lived
 *  download link. */
export async function exportAuditPack(presetId: AuditPresetId): Promise<ExportPackResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");

  const preset = AUDIT_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error("unknown preset");

  const artefacts = scopeArtefacts(presetId, await loadVault(business.id));
  if (artefacts.length === 0) throw new Error("nothing in scope for that pack yet");

  const svcForDownload = createServiceClient();
  const bundle = await buildAuditBundle({
    businessName: business.name,
    presetLabel: preset.label,
    artefacts,
    download: async (path) => {
      const { data } = await svcForDownload.storage.from("evidence").download(path);
      return data ? new Uint8Array(await data.arrayBuffer()) : null;
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const path = `${business.id}/audit-packs/${presetId}-${stamp}-${Date.now()}.pdf`;
  const svc = createServiceClient();
  const { error: upErr } = await svc.storage.from("evidence").upload(path, Buffer.from(bundle.bytes), {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) throw new Error(`audit pack upload failed: ${upErr.message}`);

  await supabase.from("evidence").insert({
    business_id: business.id,
    type: "audit_pack",
    file_path: path,
    meta: { preset: presetId, included: bundle.included, skipped: bundle.skipped, pages: bundle.pageCount },
    retention_class: "standard",
  });
  await supabase.from("events").insert({
    business_id: business.id,
    actor_kind: "user",
    actor_id: user.id,
    action: "audit_pack.exported",
    entity: "evidence",
    entity_id: null,
    payload: { preset: presetId, included: bundle.included, skipped: bundle.skipped, pages: bundle.pageCount, path },
  });

  const fileName = `audit-pack-${presetId}-${stamp}.pdf`;
  const { data: signed, error: signErr } = await svc.storage.from("evidence").createSignedUrl(path, 300, { download: fileName });
  if (signErr || !signed) throw new Error("pack stored but the download link failed — find it in the vault");

  return {
    downloadUrl: signed.signedUrl,
    fileName,
    included: bundle.included,
    skipped: bundle.skipped,
    pageCount: bundle.pageCount,
    generatedLabel: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  };
}

/** Short-lived download link for a single stored artefact file. */
export async function getArtefactDownloadUrl(filePath: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");
  // RLS-equivalent guard: only files under this business's prefix.
  if (!filePath.startsWith(`${business.id}/`)) throw new Error("not your file");

  const svc = createServiceClient();
  const { data: signed, error } = await svc.storage.from("evidence").createSignedUrl(filePath, 60);
  if (error || !signed) throw new Error("download unavailable just now");
  return signed.signedUrl;
}
