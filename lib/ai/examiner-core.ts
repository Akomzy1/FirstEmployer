/**
 * The Examiner — the product's core IP (CLAUDE.md Rules 2 & 3).
 *
 * INDEPENDENCE BY CONSTRUCTION. This module imports NO generator internals. It
 * receives only three things: the finished document artefact, the questionnaire
 * facts, and the live config values. It never sees the generator's prompt,
 * reasoning, or conversation — they communicate solely through the document.
 * If you ever find yourself importing from `./generator` here, stop: that is the
 * escalation path in CLAUDE.md §9.
 *
 * HYBRID EVALUATION.
 * - Deterministic evaluators (`/lib/rules/examiner-checklist.ts`) run for all 13
 *   checks and are the release gate. Any single deterministic FAIL fails the
 *   document — no LLM can rescue it.
 * - A separate temperature-0 LLM pass judges the `language`-kind checks
 *   (plain-English standard, subtle cross-clause consistency) and can only add
 *   failures. It runs with its OWN system prompt and OWN API call.
 *
 * FAIL CLOSED. Any FAIL → verdict "fail". The pipeline routes a document that
 * still fails after the maximum revisions to human review; nothing is delivered
 * unexamined.
 *
 * This is the server-agnostic CORE (no `server-only`) so the adversarial suite can
 * exercise it directly. The app imports the `server-only` wrapper `./examiner`.
 */
import type { StatutoryConfig } from "@/lib/config/types";
import type { ContractFacts, GeneratedContract } from "@/lib/templates/contract/types";
import {
  EXAMINER_CHECKS,
  computeChecklistHash,
  runDeterministicChecks,
  type EvalContext,
} from "../rules/examiner-checklist";
import type {
  Examine,
  ExamineInput,
  ExaminationCheck,
  ExaminationDefect,
  ExaminationResult,
} from "./examiner-types";
import { EXAMINER_VERSION } from "./versions";
import { EXAMINATION_MODEL, ZERO_TEMPERATURE } from "./models";

export { EXAMINER_VERSION };

/** Returns the model's raw text for the language pass. Injectable for tests. */
export type ExaminerLanguageTransport = (prompt: { system: string; user: string }) => Promise<string>;

export interface ExamineOptions {
  /** Language-pass transport. Defaults to a real Claude call when a key is set;
   *  when neither is available the examination is deterministic-only. */
  languageTransport?: ExaminerLanguageTransport;
}

interface LanguageVerdict {
  id: number;
  status: "pass" | "fail";
  detail?: string;
}

/** Build the examiner's OWN language-pass prompt. Independent of the generator. */
function buildLanguagePrompt(
  document: GeneratedContract,
  facts: ContractFacts,
  config: StatutoryConfig,
): { system: string; user: string } {
  const languageChecks = EXAMINER_CHECKS.filter((c) => c.kind === "language").map((c) => ({
    id: c.id,
    name: c.name,
    statutory_ref: c.statutory_ref,
    plain_english: c.plain_english,
  }));
  const system = [
    "You are FirstEmployer's independent Examiner. You review a finished UK written statement of employment particulars. You did NOT write it and you have no access to how it was drafted — you judge only what is on the page.",
    "For each language check you are given, decide pass or fail on TWO grounds only:",
    "1. Plain-English standard: is the clause clear and readable at reading age 9, en-GB?",
    "2. Consistency: does the clause contradict any other clause in the document?",
    "Do not re-judge statutory figures or presence — those are checked separately. Be strict: if a clause is confusing or contradicts another, fail it.",
    'Return ONLY JSON: {"checks":[{"id":number,"status":"pass"|"fail","detail":string}]}. Include every check id you were given. No prose, no markdown.',
  ].join("\n");
  const user = [
    "STATUTORY VALUES (context only; do not re-judge):",
    JSON.stringify(config.minimum_wage),
    "",
    "QUESTIONNAIRE FACTS:",
    JSON.stringify({ employer: facts.employerName, employee: facts.employeeName, notice: facts.notice, probation: facts.probation }),
    "",
    "LANGUAGE CHECKS TO JUDGE:",
    JSON.stringify(languageChecks),
    "",
    "THE DOCUMENT (clauses):",
    JSON.stringify(document.clauses.map((c) => ({ id: c.id, heading: c.heading, body: c.body }))),
  ].join("\n");
  return { system, user };
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in examiner output");
  return JSON.parse(text.slice(start, end + 1));
}

/** The examiner's OWN Claude call — separate system prompt, separate request. */
async function anthropicLanguageTransport(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: EXAMINATION_MODEL,
    max_tokens: 1024,
    temperature: ZERO_TEMPERATURE,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function runLanguagePass(
  document: GeneratedContract,
  facts: ContractFacts,
  config: StatutoryConfig,
  transport: ExaminerLanguageTransport,
): Promise<Map<number, LanguageVerdict>> {
  const raw = await transport(buildLanguagePrompt(document, facts, config));
  const parsed = extractJson(raw) as { checks?: LanguageVerdict[] };
  const map = new Map<number, LanguageVerdict>();
  for (const v of parsed.checks ?? []) {
    if (typeof v.id === "number" && (v.status === "pass" || v.status === "fail")) map.set(v.id, v);
  }
  return map;
}

/**
 * Examine a document. Runs the deterministic gate, then (if a transport/key is
 * available) the LLM language pass, and combines them. Any FAIL → verdict fail.
 */
export async function examineContract(input: ExamineInput, opts: ExamineOptions = {}): Promise<ExaminationResult> {
  const ctx: EvalContext = { document: input.document, facts: input.facts, config: input.config };
  const deterministic = runDeterministicChecks(ctx);

  const transport = opts.languageTransport ?? (process.env.ANTHROPIC_API_KEY ? anthropicLanguageTransport : null);
  let language: Map<number, LanguageVerdict> | null = null;
  if (transport) {
    try {
      language = await runLanguagePass(input.document, input.facts, input.config, transport);
    } catch (err) {
      // The language layer is additive. If it errors, the deterministic gate still
      // stands; log honestly and continue rather than passing a broken layer.
      console.warn(`[examiner] language pass failed, deterministic gate only: ${(err as Error).message}`);
    }
  }

  const checks: ExaminationCheck[] = [];
  const defects: ExaminationDefect[] = [];

  for (const def of EXAMINER_CHECKS) {
    const det = deterministic.find((d) => d.id === def.id)!.result;
    let status: "pass" | "fail" = det.status;
    let detail = det.detail;
    let suggestedFix = det.suggestedFix;

    // The LLM can only ADD a failure to a language check, never rescue one.
    if (def.kind === "language" && status === "pass" && language) {
      const lv = language.get(def.id);
      if (lv && lv.status === "fail") {
        status = "fail";
        detail = lv.detail || "The clause is unclear or inconsistent with another clause.";
        suggestedFix = "Rewrite the clause so it is clear and consistent with the rest of the contract.";
      }
    }

    checks.push({ id: def.id, name: def.name, status, detail, statutoryRef: def.statutory_ref });
    if (status === "fail") {
      defects.push({
        clauseRef: `check ${def.id}`,
        issue: detail ?? def.name,
        statutoryBasis: def.statutory_ref,
        suggestedFix: suggestedFix ?? `Correct so that: ${def.plain_english}`,
      });
    }
  }

  const verdict = checks.every((c) => c.status === "pass") ? "pass" : "fail";
  return {
    verdict,
    attempt: input.attempt,
    checks,
    defects,
    examinerVersion: EXAMINER_VERSION,
    configVersion: input.configLabel,
    checklistHash: computeChecklistHash(input.configLabel, EXAMINER_VERSION),
  };
}

/** Bind options into the pipeline's `Examine` signature. */
export function makeExaminer(opts: ExamineOptions = {}): Examine {
  return (input: ExamineInput) => examineContract(input, opts);
}
