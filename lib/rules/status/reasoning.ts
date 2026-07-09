import type { Confidence, FactorResult, Indication, Question, Verdict } from "./types";

/**
 * Template-assembled plain-English text (CLAUDE.md Rule 1 — NO LLM).
 * Deterministic: identical factors always yield identical prose.
 */

/** Per-factor "what this indicates" line, keyed by factor group + indication. */
const INDICATES: Record<Question["group"], Record<Indication, string>> = {
  personal_service: {
    employee: "The work must be done by {name} personally — they can't freely send someone else. That personal service is a hallmark of employment.",
    self_employed: "{name} can send a substitute to do the work. A genuine right to do that points away from employment.",
    worker: "The work is mostly done by {name} personally — consistent with worker or employee status.",
    neutral: "Whether {name} must do the work personally depends on the job — a mixed picture.",
  },
  control: {
    employee: "You decide when, where and how {name} works. That day-to-day control is what an employer has over an employee, not what a client has over a contractor.",
    self_employed: "{name} decides when, where and how the work is done. That independence points to self-employment.",
    worker: "Control over the work is shared — consistent with worker status.",
    neutral: "Control over the work is agreed job by job — this doesn't point strongly either way.",
  },
  mutuality: {
    employee: "You're expected to keep offering work and {name} is expected to take it. That ongoing two-way obligation is a strong sign of employment.",
    self_employed: "There's no ongoing promise of work — it's ad hoc or a one-off. That points away from an employment contract.",
    worker: "There's some expectation of work, but no firm ongoing promise — the middle ground of worker status.",
    neutral: "The promise of work is loose — a mixed picture on mutuality.",
  },
  equipment: {
    employee: "You provide the tools and equipment, as an employer usually does.",
    self_employed: "{name} brings their own significant equipment — a sign of running their own business.",
    worker: "Tools and equipment are shared.",
    neutral: "Tools and equipment are a mix of yours and theirs.",
  },
  financial: {
    employee: "{name} is paid a set rate and takes no real financial risk — consistent with employment.",
    self_employed: "{name} takes real financial risk and can profit or lose from how they run the work — a sign of being in business for themselves.",
    worker: "{name} takes limited financial risk.",
    neutral: "There's little financial risk either way.",
  },
  integration: {
    employee: "{name} is built into your team like your other staff — pointing to employment.",
    self_employed: "{name} sits outside your organisation as a separate contractor.",
    worker: "{name} is partly integrated into your team.",
    neutral: "{name} is only loosely part of your team.",
  },
  exclusivity: {
    employee: "{name} works only for you, as an employee typically does.",
    self_employed: "{name} has other clients and isn't set up to work only for you.",
    worker: "{name} works mainly for you.",
    neutral: "{name} does some work elsewhere.",
  },
};

export function factorIndicates(group: Question["group"], indication: Indication, name: string): string {
  const line = INDICATES[group][indication] ?? INDICATES[group].neutral;
  return line.replaceAll("{name}", name);
}

const CONFIDENCE_TAIL: Record<Confidence, string> = {
  clear: "There's little room for doubt.",
  leaning: "The answers point mostly this way, though one or two pull the other direction.",
  ambiguous:
    "But the answers genuinely pull both ways, so this isn't clear-cut — it's worth a short conversation with an adviser before you rely on it.",
};

const VERDICT_LEAD: Record<Verdict, (name: string) => string> = {
  employee: (name) =>
    `Taken together, your answers describe the classic marks of employment — control over the work, personal service, and an ongoing two-way promise of work. ${name} meets the legal definition of an employee, so they get the full set of employee rights, from a written statement of terms to protection from unfair dismissal.`,
  worker: (name) =>
    `${name} does the work personally, but there isn't the firm ongoing promise of work or the degree of control that makes someone an employee — and they aren't genuinely running their own business either. That middle ground is 'worker' status: ${name} gets key rights like the minimum wage and paid holiday, but not the full set an employee has.`,
  self_employed: (name) =>
    `Taken together, your answers describe someone in business on their own account — free to send a substitute or choose their own methods, taking real financial risk, and not built into your organisation. In law that makes ${name} a self-employed contractor, and you are their client rather than their employer.`,
};

export function assembleReasoning(name: string, verdict: Verdict, confidence: Confidence): string {
  return `${VERDICT_LEAD[verdict](name)} ${CONFIDENCE_TAIL[confidence]}`;
}

/** One-line human verdict label. */
export const VERDICT_LABEL: Record<Verdict, string> = {
  employee: "Employee",
  worker: "Worker",
  self_employed: "Self-employed contractor",
};
