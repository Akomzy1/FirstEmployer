/**
 * The Assistant — the second (and last) sanctioned Claude caller (CLAUDE.md
 * Rule 1). It READS state and never mutates it; it never computes a deadline
 * (it quotes the obligations engine's output, injected read-only); and every
 * answer either carries sources from the provided grounding or becomes a
 * signpost — never an unsourced legal claim.
 *
 * Enforcement is layered, deterministic-first:
 *  1. Boundary topics (dismissal/discrimination/disputes) are detected BEFORE
 *     any model call — a boundary question never reaches Claude.
 *  2. Non-UK questions are signposted before any model call.
 *  3. The model must answer in a JSON schema citing source ids from the
 *     retrieved corpus; `validateAssistantResponse` rejects answers with no
 *     sources, unknown sources, invented statutory refs, or £/percentage
 *     figures that don't appear in the provided grounding (config, corpus,
 *     obligations context, or the question itself). Rejected → signpost.
 *
 * Server-agnostic core (the examiner-core pattern) so the adversarial suite
 * runs offline; `./assistant.ts` is the server-only entry.
 */
import type { StatutoryConfig } from "@/lib/config/types";
import {
  checkBoundary,
  isNonUkQuestion,
  BOUNDARY_HELPLINE,
  BOUNDARY_LINK,
  BOUNDARY_TITLE,
  type BoundaryTopic,
} from "./assistant-boundaries";
import { retrieveGuidance, type GuidanceDoc } from "./guidance-corpus";
import { GENERATION_MODEL, ZERO_TEMPERATURE } from "./models";

export const ASSISTANT_VERSION = "ast-1.0";

export interface AssistantSource {
  label: string;
  url: string;
}

export interface AssistantReceipt {
  reference: string;
  plainEnglish: string;
  guidanceUrl?: string;
}

export type AssistantResponse =
  | { kind: "answer"; text: string; sources: AssistantSource[]; receipt: AssistantReceipt | null; groundedOn: string[] }
  | { kind: "signpost"; text: string; sources: AssistantSource[] }
  | {
      kind: "boundary";
      topic: BoundaryTopic;
      title: string;
      body: string;
      helpline: typeof BOUNDARY_HELPLINE;
      link: typeof BOUNDARY_LINK;
    };

export type AssistantTransport = (prompt: { system: string; user: string }) => Promise<string>;

export interface AssistantInput {
  question: string;
  config: StatutoryConfig;
  configLabel: string;
  /** Engine-formatted, read-only summary of the business's obligations. The
   *  assistant quotes these dates; it never computes them. */
  obligationsContext: string;
  corpus: GuidanceDoc[];
}

const FALLBACK_SOURCE: AssistantSource = {
  label: "GOV.UK — Employing staff for the first time",
  url: "https://www.gov.uk/employing-staff",
};

const SIGNPOST_TEXT =
  "I don't want to guess on this one — an answer's no good to you unless I can show you where it comes from.\n\nHere's the official guidance straight from the source, and you can always ask our human team if you'd rather talk it through.";

const NON_UK_TEXT =
  "I only cover UK employment law, so I'd be guessing anywhere else — and a guess is no good to you.\n\nFor the UK side of your question, the official guidance below is the right starting point.";

function signpost(docs: GuidanceDoc[], text = SIGNPOST_TEXT): AssistantResponse {
  const sources = docs.length ? docs.map((d) => ({ label: d.title, url: d.url })) : [FALLBACK_SOURCE];
  return { kind: "signpost", text, sources };
}

/* ------------------------- prompt ------------------------- */

export function buildAssistantPrompt(input: AssistantInput, docs: GuidanceDoc[]): { system: string; user: string } {
  const system = [
    "You are FirstEmployer's assistant for UK first-time employers. Plain English, reading age 9, en-GB. Reassure before instructing. Short sentences.",
    "HARD RULES:",
    "- Ground every claim in the SOURCES, CONFIG VALUES, or YOUR ACCOUNT context provided. If you cannot, say so — do not improvise.",
    "- Statutory figures: use ONLY numbers present in CONFIG VALUES or the sources. Never a rate from memory.",
    "- Deadlines: quote YOUR ACCOUNT verbatim; never calculate a date yourself.",
    "- UK employment law only. No dismissal, discrimination, or dispute advice — those are out of scope.",
    "- You cannot change anything in the account; you only explain and point.",
    'Respond ONLY with JSON: {"answer": string, "source_ids": string[], "statutory_ref": {"reference": string, "plainEnglish": string} | null, "grounded": boolean}.',
    "source_ids must list the ids of the provided sources you actually used (at least one when grounded=true).",
    "statutory_ref only when the answer makes a statutory claim, and reference must appear in a provided source's refs.",
    "If the provided material cannot answer the question, return grounded=false with an empty source_ids.",
  ].join("\n");

  const user = [
    "SOURCES:",
    JSON.stringify(docs.map((d) => ({ id: d.id, title: d.title, url: d.url, refs: d.refs, content: d.body }))),
    "",
    `CONFIG VALUES (statutory, version ${input.configLabel} — the only figures you may quote):`,
    JSON.stringify(input.config),
    "",
    "YOUR ACCOUNT (read-only; quote deadlines verbatim):",
    input.obligationsContext || "No obligations recorded yet.",
    "",
    "QUESTION:",
    input.question,
  ].join("\n");

  return { system, user };
}

/* ------------------------- validation ------------------------- */

interface ModelReply {
  answer?: unknown;
  source_ids?: unknown;
  statutory_ref?: { reference?: unknown; plainEnglish?: unknown } | null;
  grounded?: unknown;
}

/** Every number the model is allowed to state: from config, corpus, the
 *  obligations context, or the question itself. */
function allowedNumbers(input: AssistantInput, docs: GuidanceDoc[]): Set<string> {
  const pool = [JSON.stringify(input.config), input.obligationsContext, input.question, ...docs.map((d) => d.body)].join(" ");
  return new Set(Array.from(pool.matchAll(/\d+(?:,\d{3})*(?:\.\d+)?/g)).map((m) => m[0].replace(/,/g, "")));
}

/**
 * Deterministic gate over the model's reply. Returns the safe response — a
 * grounded answer only when every check passes, otherwise a signpost.
 */
export function validateAssistantResponse(
  raw: string,
  input: AssistantInput,
  docs: GuidanceDoc[],
): AssistantResponse {
  let parsed: ModelReply;
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("no json");
    parsed = JSON.parse(raw.slice(start, end + 1)) as ModelReply;
  } catch {
    return signpost(docs);
  }

  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
  const sourceIds = Array.isArray(parsed.source_ids) ? parsed.source_ids.filter((s): s is string => typeof s === "string") : [];
  if (!answer || parsed.grounded !== true) return signpost(docs);

  // Sources must be non-empty and every id must be one we actually provided.
  const docById = new Map(docs.map((d) => [d.id, d]));
  const cited = sourceIds.map((id) => docById.get(id)).filter((d): d is GuidanceDoc => !!d);
  if (cited.length === 0) return signpost(docs);

  // Money/percentage figures must come from the provided grounding.
  const allowed = allowedNumbers(input, docs);
  const figures = Array.from(answer.matchAll(/£\s?(\d+(?:,\d{3})*(?:\.\d+)?)|(\d+(?:\.\d+)?)\s?%/g));
  for (const f of figures) {
    const n = (f[1] ?? f[2] ?? "").replace(/,/g, "");
    if (n && !allowed.has(n)) return signpost(docs);
  }

  // A statutory ref must exist in the cited sources' refs — no invented citations.
  let receipt: AssistantReceipt | null = null;
  const sr = parsed.statutory_ref;
  if (sr && typeof sr.reference === "string" && sr.reference.trim()) {
    const knownRefs = new Set(cited.flatMap((d) => d.refs));
    if (!knownRefs.has(sr.reference.trim())) return signpost(docs);
    receipt = {
      reference: sr.reference.trim(),
      plainEnglish: typeof sr.plainEnglish === "string" && sr.plainEnglish ? sr.plainEnglish : "This is the law the answer is based on.",
      guidanceUrl: cited[0]?.url,
    };
  }

  return {
    kind: "answer",
    text: answer,
    sources: cited.map((d) => ({ label: d.title, url: d.url })),
    receipt,
    groundedOn: cited.map((d) => d.id),
  };
}

/* ------------------------- entry ------------------------- */

async function anthropicTransport(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 1024,
    temperature: ZERO_TEMPERATURE,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export async function answerQuestion(
  input: AssistantInput,
  opts: { transport?: AssistantTransport } = {},
): Promise<AssistantResponse> {
  // 1. Boundary topics never reach the model.
  const boundary = checkBoundary(input.question);
  if (boundary) {
    return {
      kind: "boundary",
      topic: boundary.topic,
      title: BOUNDARY_TITLE,
      body: boundary.body,
      helpline: BOUNDARY_HELPLINE,
      link: BOUNDARY_LINK,
    };
  }

  const docs = retrieveGuidance(input.question, input.corpus);

  // 2. Non-UK law: polite scope signpost, no model call.
  if (isNonUkQuestion(input.question)) return signpost(docs, NON_UK_TEXT);

  // 3. No transport/key → honest signpost with the best matching guidance.
  const transport = opts.transport ?? (process.env.ANTHROPIC_API_KEY ? anthropicTransport : null);
  if (!transport) return signpost(docs);

  // 4. Grounded model call, gated by the deterministic validator.
  try {
    const raw = await transport(buildAssistantPrompt(input, docs));
    return validateAssistantResponse(raw, input, docs);
  } catch (err) {
    console.warn(`[assistant] transport failed, signposting: ${(err as Error).message}`);
    return signpost(docs);
  }
}
