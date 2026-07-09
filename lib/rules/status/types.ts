/** Employment-status determination — deterministic core (CLAUDE.md Rule 1). */

export type Verdict = "employee" | "worker" | "self_employed";
export type Confidence = "clear" | "leaning" | "ambiguous";

/** Which status an individual answer points toward. */
export type Indication = "employee" | "worker" | "self_employed" | "neutral";

export interface AnswerOption {
  value: string;
  title: string;
  description?: string;
  indication: Indication;
}

/** A questionnaire question. `name` is templated in at render ({name} token). */
export interface Question {
  id: string;
  factor: string;
  /** One of the seven case-law factor groups this question informs. */
  group: "personal_service" | "control" | "mutuality" | "financial" | "equipment" | "integration" | "exclusivity";
  question: string;
  why: string;
  options: AnswerOption[];
}

export interface FactorResult {
  id: string;
  factor: string;
  group: Question["group"];
  answer: string;
  /** Human label of the chosen option. */
  answerLabel: string;
  indication: Indication;
  /** Plain-English "what this indicates" line, template-assembled. */
  indicates: string;
  reference: { reference: string; plainEnglish: string; guidanceUrl: string };
}

export interface Determination {
  verdict: Verdict;
  confidence: Confidence;
  factors: FactorResult[];
  /** Template-assembled reasoning paragraph (NO LLM — Rule 1). */
  reasoning: string;
  rules_version: string;
}
