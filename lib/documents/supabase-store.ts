/**
 * Supabase implementation of the pipeline's DocumentStore. Row writes go through
 * the authenticated (RLS-scoped) client; the artefact is stored in the private
 * `evidence` bucket via the service client, under the business's path prefix.
 * The examinations row is immutable (append-only) by trigger.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedContract } from "@/lib/templates/contract/types";
import type { DocumentStore } from "./pipeline";
import { STUB_EXAMINER_VERSION } from "@/lib/ai/examiner-stub";

export interface SupabaseStoreDeps {
  db: SupabaseClient;
  storage: SupabaseClient;
  businessId: string;
  employeeId: string;
  actorId: string;
}

export function createSupabaseDocumentStore(deps: SupabaseStoreDeps): DocumentStore {
  const { db, storage, businessId, employeeId, actorId } = deps;

  const recordEvent: DocumentStore["recordEvent"] = async ({ action, entityId, payload }) => {
    await db.from("events").insert({
      business_id: businessId,
      actor_kind: "system",
      actor_id: actorId,
      action,
      entity: "document",
      entity_id: entityId,
      payload,
    });
  };

  return {
    async createDocument({ questionnaire }) {
      const { data, error } = await db
        .from("documents")
        .insert({
          business_id: businessId,
          employee_id: employeeId,
          type: "employment_contract",
          status: "draft",
          version: 1,
          questionnaire,
        })
        .select("id, version")
        .single();
      if (error) throw new Error(`create document failed: ${error.message}`);
      return { id: data.id as string, version: data.version as number };
    },

    async setStatus(documentId, status) {
      const { error } = await db.from("documents").update({ status }).eq("id", documentId);
      if (error) throw new Error(`set document status failed: ${error.message}`);
    },

    async saveContent(documentId, version, contract) {
      const path = `${businessId}/documents/${documentId}/v${version}.json`;
      const { error: upErr } = await storage.storage
        .from("evidence")
        .upload(path, JSON.stringify(contract, null, 2), { contentType: "application/json", upsert: true });
      if (upErr) throw new Error(`save document content failed: ${upErr.message}`);
      await db.from("documents").update({ content_path: path }).eq("id", documentId);
      return path;
    },

    async recordExamination({ documentId, result, generatorVersion }) {
      const { error } = await db.from("examinations").insert({
        document_id: documentId,
        attempt: result.attempt,
        verdict: result.verdict,
        checks: result.checks,
        defects: result.defects,
        generator_version: generatorVersion,
        examiner_version: result.examinerVersion || STUB_EXAMINER_VERSION,
        config_version: result.configVersion,
        checklist_hash: result.checklistHash,
      });
      if (error) throw new Error(`record examination failed: ${error.message}`);
    },

    async enqueueHumanReview({ documentId, defects }) {
      await recordEvent({
        action: "document.human_review_queued",
        entityId: documentId,
        payload: { defects },
      });
    },

    recordEvent,
  };
}
