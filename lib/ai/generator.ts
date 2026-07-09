/**
 * Document Generator — one of only two subsystems that may call the Claude API
 * (CLAUDE.md Rule 1). It drafts the written statement of employment particulars
 * from: the solicitor clause library, the questionnaire facts, and statutory
 * values injected FROM CONFIG (Rule 4 — never inline). It NEVER shares context
 * with the examiner (Rule 3).
 *
 * Determinism + safety:
 * - The clause library render is the authoritative legal baseline. Claude adapts
 *   tone/plain-English at temperature 0; it is told never to change statutory
 *   figures or add clauses.
 * - If the Claude transport is absent or errors, the generator returns the
 *   template-rendered contract (itself solicitor-owned, config-compliant). It
 *   still passes the Examiner before any user sees it — nothing is bypassed.
 * - On a revision, only the examiner's structured defect list is fed back
 *   (defects only, never examiner reasoning — Rule 3).
 *
 * This module contains NO statutory literals (grep gate) — every figure is read
 * from the passed config.
 */
import "server-only";
import type { StatutoryConfig } from "@/lib/config/types";
import { renderContractFromTemplates } from "../templates/contract/render";
import type { ContractFacts, GeneratedContract, ContractClause } from "../templates/contract/types";
import type { ExaminationDefect } from "./examiner-types";
import { GENERATION_MODEL, ZERO_TEMPERATURE } from "./models";
import { GENERATOR_VERSION } from "./versions";

export { GENERATOR_VERSION };

/** Returns the model's raw text for a prompt. Injectable so tests/dev run without a key. */
export type GeneratorTransport = (prompt: { system: string; user: string }) => Promise<string>;

export interface GenerateOptions {
  transport?: GeneratorTransport;
  /** Examiner defects from the prior attempt — defect-only feedback (Rule 3). */
  priorDefects?: ExaminationDefect[];
}

/**
 * Assemble the generator prompt. Pure and side-effect-free. Statutory values are
 * passed as data (from config); the clause library render is the legal baseline.
 */
export function buildGeneratorPrompt(
  facts: ContractFacts,
  config: StatutoryConfig,
  priorDefects?: ExaminationDefect[],
): { system: string; user: string } {
  const baseline = renderContractFromTemplates(facts, config);
  const system = [
    "You are FirstEmployer's Document Generator. You produce a UK written statement of employment particulars (Employment Rights Act 1996 s.1, as amended).",
    "You are given an authoritative, solicitor-owned clause baseline and the statutory values that apply. Your ONLY job is to return the clauses in clear, plain English at reading age 9, en-GB spelling.",
    "Hard rules:",
    "- Never change any statutory figure, rate, threshold, or date. Use exactly the values provided.",
    "- Never add, remove, or renumber clauses. Return every clause you are given, with the same id, heading, statutoryRef and checkId.",
    "- Never invent statutory content. If unsure, keep the baseline wording.",
    "- Reassure before instructing; keep sentences short.",
    "Return ONLY a JSON object: {\"clauses\":[{\"id\":string,\"heading\":string,\"statutoryRef\":string,\"checkId\":number,\"body\":string}]}. No prose, no markdown fences.",
  ].join("\n");

  const revision = priorDefects && priorDefects.length
    ? [
        "",
        "This is a revision. The Examiner found these defects in the previous draft. Fix ONLY these, without changing anything else:",
        ...priorDefects.map((d) => `- [${d.clauseRef}] ${d.issue} → ${d.suggestedFix} (${d.statutoryBasis})`),
      ].join("\n")
    : "";

  const user = [
    "STATUTORY VALUES (use exactly; do not alter):",
    JSON.stringify(config.minimum_wage),
    JSON.stringify({ holiday_weeks: config.holiday.statutory_weeks, pension: config.pension }),
    "",
    "QUESTIONNAIRE FACTS:",
    JSON.stringify(sanitisedFacts(facts)),
    "",
    "CLAUSE BASELINE (authoritative legal text to re-express in plain English):",
    JSON.stringify(baseline.clauses),
    revision,
  ].join("\n");

  return { system, user };
}

/** Facts passed to the model — no internal objects, just the answered values. */
function sanitisedFacts(facts: ContractFacts) {
  const { wageBand, ...rest } = facts;
  return { ...rest, apprentice: !!wageBand.isApprentice };
}

/** Extract the first balanced JSON object from model text (tolerates stray prose). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in generator output");
  return JSON.parse(text.slice(start, end + 1));
}

/** The default transport: a real Claude API call. Requires ANTHROPIC_API_KEY. */
async function anthropicTransport(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 4096,
    temperature: ZERO_TEMPERATURE,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
  return msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

/**
 * Generate the contract. Uses the injected/real Claude transport when available,
 * and falls back safely to the solicitor template render otherwise. The result is
 * always the full clause set — the Examiner gates it regardless.
 */
export async function generateContract(
  facts: ContractFacts,
  config: StatutoryConfig,
  opts: GenerateOptions = {},
): Promise<GeneratedContract> {
  const baseline = renderContractFromTemplates(facts, config);
  const transport = opts.transport ?? (process.env.ANTHROPIC_API_KEY ? anthropicTransport : null);
  if (!transport) return baseline; // no key, no injected transport → safe template render

  try {
    const prompt = buildGeneratorPrompt(facts, config, opts.priorDefects);
    const raw = await transport(prompt);
    const parsed = extractJson(raw) as { clauses?: Partial<ContractClause>[] };
    if (!parsed.clauses || !Array.isArray(parsed.clauses)) throw new Error("generator output missing clauses");

    // Merge model bodies onto the authoritative baseline: keep id/heading/ref/checkId
    // from the baseline, take only the re-expressed body from the model. This makes
    // it structurally impossible for the model to drop or renumber a clause.
    const clauses: ContractClause[] = baseline.clauses.map((base) => {
      const m = parsed.clauses!.find((c) => c.id === base.id);
      const body = typeof m?.body === "string" && m.body.trim().length > 0 ? m.body.trim() : base.body;
      return { ...base, body };
    });
    const body = [baseline.body.split("\n\n")[0], ...clauses.map((c) => `${c.heading}\n${c.body}`)].join("\n\n");
    return { title: baseline.title, clauses, body, source: "assistant" };
  } catch (err) {
    console.warn(`[generator] Claude generation failed, using template baseline: ${(err as Error).message}`);
    return baseline;
  }
}
