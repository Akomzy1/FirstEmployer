import type { Confidence, Determination, FactorResult, Indication, Verdict } from "./types";
import { QUESTIONS, QUESTION_REF, questionById, type StatusAnswers } from "./questions";
import { REFERENCES } from "./references";
import { assembleReasoning, factorIndicates } from "./reasoning";

/**
 * Deterministic employment-status engine (CLAUDE.md Rule 1). No LLM, no I/O,
 * no clock, no randomness — identical answers ALWAYS produce a byte-identical
 * determination. Mirrors the case-law "irreducible minimum" (Ready Mixed
 * Concrete: personal service + control + mutuality) plus the wider
 * business-on-own-account factors that separate worker from self-employed.
 *
 * Changing any verdict below without bumping RULES_VERSION is a CI failure
 * (the golden suite pins every verdict to this version).
 */
export const RULES_VERSION = "sa-1.0";

const CORE_CONTROL = ["q_control_place", "q_control_how"];
const CORE_MOO = ["q_moo_ongoing", "q_moo_refuse"];
const SUPPORTING = ["q_equipment", "q_risk", "q_integration", "q_exclusivity", "q_pay", "q_benefits", "q_own_business"];

function indicationOf(qid: string, answer: string | undefined): Indication {
  const opt = questionById(qid).options.find((o) => o.value === answer);
  return opt?.indication ?? "neutral";
}
const countIndication = (ids: string[], answers: StatusAnswers, ind: Indication) =>
  ids.filter((id) => indicationOf(id, answers[id]) === ind).length;

interface Scores {
  sub: string;
  controlEmp: number;
  controlSelf: number;
  mooEmp: number;
  mooSelf: number;
  supEmp: number;
  supSelf: number;
  /** Weighted pull toward each pole (core factors weighted x2, personal service x3). */
  empScore: number;
  selfScore: number;
}

function score(answers: StatusAnswers): Scores {
  const sub = answers.q_substitution;
  const controlEmp = countIndication(CORE_CONTROL, answers, "employee");
  const controlSelf = countIndication(CORE_CONTROL, answers, "self_employed");
  const mooEmp = countIndication(CORE_MOO, answers, "employee");
  const mooSelf = countIndication(CORE_MOO, answers, "self_employed");
  const supEmp = countIndication(SUPPORTING, answers, "employee");
  const supSelf = countIndication(SUPPORTING, answers, "self_employed");
  const empScore = (sub === "himself" ? 3 : 0) + controlEmp * 2 + mooEmp * 2 + supEmp;
  const selfScore = (sub === "sub" ? 3 : 0) + controlSelf * 2 + mooSelf * 2 + supSelf;
  return { sub, controlEmp, controlSelf, mooEmp, mooSelf, supEmp, supSelf, empScore, selfScore };
}

function decideVerdict(s: Scores): Verdict {
  // Genuine unfettered substitution defeats personal service — the necessary
  // condition for both employee and worker status (Pimlico Plumbers).
  if (s.sub === "sub") return "self_employed";

  const controlSufficient = s.controlEmp > s.controlSelf;
  const mooPresent = s.mooEmp > s.mooSelf;

  if (s.sub === "himself") {
    // Personal service present → the Ready Mixed Concrete gateway.
    if (mooPresent && controlSufficient) return "employee";
    if (!mooPresent && s.supSelf >= 4) return "self_employed";
    return "worker";
  }

  // sub === "depends": a qualified/occasional substitution right.
  if (mooPresent && controlSufficient && s.supSelf <= 2) return "employee";
  if (s.supSelf >= 4) return "self_employed";
  return "worker";
}

function decideConfidence(verdict: Verdict, s: Scores): Confidence {
  if (verdict === "employee") {
    const conf: Confidence = s.selfScore <= 2 ? "clear" : s.selfScore <= 4 ? "leaning" : "ambiguous";
    // An occasional/conditional substitution right introduces a real doubt, so
    // never call it a "clear" employee even when everything else fits.
    if (conf === "clear" && s.sub === "depends") return "leaning";
    return conf;
  }
  if (verdict === "self_employed") {
    if (s.empScore <= 2) return "clear";
    if (s.empScore <= 4) return "leaning";
    return "ambiguous";
  }
  // worker — inherently the judgement-call middle; never "clear".
  if (s.empScore >= 5 && s.selfScore >= 5) return "ambiguous"; // genuine tension both ways
  if (s.selfScore >= 7) return "ambiguous"; // strong self signals conflict with a worker call
  return "leaning";
}

function buildFactors(answers: StatusAnswers, name: string): FactorResult[] {
  return QUESTIONS.map((q) => {
    const answer = answers[q.id];
    const opt = q.options.find((o) => o.value === answer);
    const indication = opt?.indication ?? "neutral";
    return {
      id: q.id,
      factor: q.factor,
      group: q.group,
      answer: answer ?? "",
      answerLabel: opt?.title ?? "",
      indication,
      indicates: factorIndicates(q.group, indication, name),
      reference: REFERENCES[QUESTION_REF[q.id]],
    };
  });
}

/**
 * Produce the determination. `name` only affects human-readable text, never the
 * verdict/confidence, so determinations stay comparable across employees.
 */
export function determineStatus(answers: StatusAnswers, name = "they"): Determination {
  const s = score(answers);
  const verdict = decideVerdict(s);
  const confidence = decideConfidence(verdict, s);
  return {
    verdict,
    confidence,
    factors: buildFactors(answers, name),
    reasoning: assembleReasoning(name, verdict, confidence),
    rules_version: RULES_VERSION,
  };
}
