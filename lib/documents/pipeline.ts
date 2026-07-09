/**
 * Generation pipeline — the deterministic orchestration of drafting, examination,
 * one revision, and fail-closed routing (CLAUDE.md Rules 1–3).
 *
 *   draft → examining → (generate → examine)
 *        pass → approved
 *        fail → revise once with defect-only feedback → examine again
 *            pass → approved
 *            fail → human_review (queued, user notified honestly)
 *
 * No document reaches `approved` without an `examinations` PASS row. Persistence
 * is injected via `DocumentStore` so this runs in a unit test with an in-memory
 * store and in the app against Supabase — the control flow is identical.
 */
import type { StatutoryConfig } from "@/lib/config/types";
import type { ContractFacts, GeneratedContract } from "@/lib/templates/contract/types";
import type { Examine, ExaminationResult, ExaminationDefect } from "@/lib/ai/examiner-types";
import { GENERATOR_VERSION } from "../ai/versions";

export const MAX_GENERATION_ATTEMPTS = 2;

/** The persistence surface the pipeline needs. */
export interface DocumentStore {
  /** Insert the draft document row; returns its id and version. */
  createDocument(input: {
    businessId: string;
    employeeId: string;
    questionnaire: Record<string, unknown>;
  }): Promise<{ id: string; version: number }>;
  setStatus(documentId: string, status: "examining" | "approved" | "human_review"): Promise<void>;
  /** Persist the artefact; returns its stored path. */
  saveContent(documentId: string, version: number, contract: GeneratedContract): Promise<string | null>;
  /** Write the immutable examinations row for one attempt. */
  recordExamination(input: {
    documentId: string;
    result: ExaminationResult;
    generatorVersion: string;
  }): Promise<void>;
  /** Queue for human review (P07/P14 surface it in admin). */
  enqueueHumanReview(input: { documentId: string; defects: ExaminationDefect[] }): Promise<void>;
  recordEvent(event: { action: string; entityId: string; payload: Record<string, unknown> }): Promise<void>;
}

export type GenerateFn = (
  facts: ContractFacts,
  config: StatutoryConfig,
  opts: { priorDefects?: ExaminationDefect[] },
) => Promise<GeneratedContract>;

export interface RunGenerationInput {
  businessId: string;
  employeeId: string;
  facts: ContractFacts;
  config: StatutoryConfig;
  configLabel: string;
  questionnaire: Record<string, unknown>;
  generate: GenerateFn;
  examine: Examine;
  store: DocumentStore;
  maxAttempts?: number;
}

/** How generation ended — drives the progress screen's terminal state. */
export type GenerationOutcome = "approve" | "fix" | "human";

export interface RunGenerationResult {
  documentId: string;
  status: "approved" | "human_review";
  outcome: GenerationOutcome;
  attempts: number;
  examinations: ExaminationResult[];
  contract: GeneratedContract;
  contentPath: string | null;
}

export async function runGeneration(input: RunGenerationInput): Promise<RunGenerationResult> {
  const maxAttempts = input.maxAttempts ?? MAX_GENERATION_ATTEMPTS;
  const { store, facts, config, configLabel } = input;

  const doc = await store.createDocument({
    businessId: input.businessId,
    employeeId: input.employeeId,
    questionnaire: input.questionnaire,
  });
  await store.setStatus(doc.id, "examining");

  const examinations: ExaminationResult[] = [];
  let priorDefects: ExaminationDefect[] | undefined;
  let lastContract: GeneratedContract | null = null;
  let contentPath: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const contract = await input.generate(facts, config, { priorDefects });
    lastContract = contract;
    contentPath = await store.saveContent(doc.id, doc.version, contract);

    const result = await input.examine({ document: contract, facts, config, configLabel, attempt });
    examinations.push(result);
    await store.recordExamination({ documentId: doc.id, result, generatorVersion: GENERATOR_VERSION });

    if (result.verdict === "pass") {
      await store.setStatus(doc.id, "approved");
      await store.recordEvent({
        action: "document.approved",
        entityId: doc.id,
        payload: { attempt, checklistHash: result.checklistHash, configVersion: result.configVersion },
      });
      return {
        documentId: doc.id,
        status: "approved",
        outcome: attempt === 1 ? "approve" : "fix",
        attempts: attempt,
        examinations,
        contract,
        contentPath,
      };
    }
    priorDefects = result.defects;
  }

  // Every attempt failed — fail closed. Never deliver, never bypass.
  await store.setStatus(doc.id, "human_review");
  await store.enqueueHumanReview({ documentId: doc.id, defects: priorDefects ?? [] });
  await store.recordEvent({
    action: "document.human_review",
    entityId: doc.id,
    payload: { attempts: maxAttempts, defects: priorDefects ?? [] },
  });
  return {
    documentId: doc.id,
    status: "human_review",
    outcome: "human",
    attempts: maxAttempts,
    examinations,
    contract: lastContract!,
    contentPath,
  };
}
