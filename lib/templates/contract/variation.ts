// LEGAL-REVIEW: Variation-letter wording is placeholder legal text pending
// solicitor sign-off (CLAUDE.md §8). The variation letter is built as a
// CONSOLIDATED STATEMENT (matching the schema's own definition of the
// `variation_letter` type): a covering variation clause followed by the full,
// re-rendered statement of particulars at the new rate. That way the Examiner's
// complete 13-check gate applies to it unchanged — the new pay clause is checked
// against the new statutory floor like any other contract (Rule 2).
import type { StatutoryConfig } from "@/lib/config/types";
import { renderClauses } from "./clauses";
import type { ContractClause, ContractFacts, GeneratedContract } from "./types";

function gbp(n: number): string {
  return "£" + n.toFixed(2);
}

function longDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export interface VariationInput {
  /** The facts with the NEW rate already applied (`hourlyRate` = new pay). */
  facts: ContractFacts;
  /** The rate being replaced, pounds. */
  previousRate: number;
  /** The date the new rate takes effect (usually the config effective date). */
  effectiveFrom: string;
  /** Why the pay is changing, plain English (e.g. the new statutory minimum). */
  reason: string;
}

/**
 * Deterministic variation-letter render (the generator's baseline for a pay
 * variation). Clause ids/checkIds match the contract library so the examiner's
 * deterministic evaluators find every particular.
 */
export function renderVariationLetter(input: VariationInput, config: StatutoryConfig): GeneratedContract {
  const { facts, previousRate, effectiveFrom, reason } = input;
  const name = facts.employeeName;

  // The covering variation clause leads; the consolidated particulars follow.
  const variationClause: ContractClause = {
    id: "variation",
    heading: "Why you're getting this letter",
    statutoryRef: "ERA 1996 s.4",
    checkId: 0, // covering clause — not one of the 13 particulars
    body:
      `From ${longDate(effectiveFrom)}, ${name}'s pay changes from ${gbp(previousRate)} to ${gbp(facts.hourlyRate)} an hour. ` +
      `${reason} ` +
      `Everything else about ${name}'s job stays the same. This letter, with the updated terms below, is the written record of that change and replaces the earlier statement.`,
  };

  const clauses = [variationClause, ...renderClauses(facts, config)];
  const title = `Variation of employment terms — ${name}`;
  const heading =
    `${title}\n${facts.employerName}\n` +
    `Notice of a change to the written statement of employment particulars (Employment Rights Act 1996 s.4).\n`;
  const body = [heading, ...clauses.map((c) => `${c.heading}\n${c.body}`)].join("\n\n");
  return { title, clauses, body, source: "template" };
}
