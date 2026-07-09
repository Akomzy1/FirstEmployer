/**
 * The examiner contract — the stable interface between the generation pipeline and
 * the Examiner (CLAUDE.md Rule 3). P06 ships this interface plus a stub; P07 ships
 * the real independent examiner implementing the SAME `Examine` signature.
 *
 * Independence by construction: the examiner receives ONLY the finished document
 * artefact, the questionnaire facts, and live config. It never receives the
 * generator's prompt, reasoning, or conversation. This type deliberately imports
 * no generator internals — only the shared artefact + facts.
 */
import type { StatutoryConfig } from "@/lib/config/types";
import type { ContractFacts, GeneratedContract } from "@/lib/templates/contract/types";

export type CheckStatus = "pass" | "fail";

export interface ExaminationCheck {
  id: number;
  name: string;
  status: CheckStatus;
  detail?: string;
  statutoryRef: string;
}

export interface ExaminationDefect {
  /** Which clause the defect is in, e.g. "clause 9" or "9,12". */
  clauseRef: string;
  issue: string;
  statutoryBasis: string;
  /** A structured, defect-only fix instruction — fed back to the generator on a
   *  revision. NEVER the examiner's reasoning (Rule 3). */
  suggestedFix: string;
}

export interface ExaminationResult {
  verdict: "pass" | "fail";
  attempt: number;
  checks: ExaminationCheck[];
  defects: ExaminationDefect[];
  examinerVersion: string;
  /** Config label live at examination time, e.g. "2026.2". */
  configVersion: string;
  /** Hash of checklist definition + config version — the VerificationSeal content. */
  checklistHash: string;
}

export interface ExamineInput {
  /** The document artefact under examination — the ONLY channel from the generator. */
  document: GeneratedContract;
  /** The questionnaire facts (shared input, not generator internals). */
  facts: ContractFacts;
  config: StatutoryConfig;
  configLabel: string;
  attempt: number;
}

/** The examiner's single entry point. Implemented by the stub (P06) and the real
 *  examiner (P07). */
export type Examine = (input: ExamineInput) => Promise<ExaminationResult>;
