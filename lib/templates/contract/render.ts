/**
 * Deterministic contract renderer. Assembles the clause library into a structured
 * artefact (clauses[] + plain-text body). This is the solicitor-owned baseline the
 * Document Generator builds from — and the safe fallback when the Claude API is
 * unavailable (fail-safe: a template-rendered, config-compliant document rather
 * than nothing). Contains no statutory literals; every figure comes from config.
 */
import type { StatutoryConfig } from "@/lib/config/types";
import { renderClauses } from "./clauses";
import type { ContractFacts, GeneratedContract } from "./types";

export function renderContractFromTemplates(
  facts: ContractFacts,
  config: StatutoryConfig,
): GeneratedContract {
  const clauses = renderClauses(facts, config);
  const title = `Written statement of employment particulars — ${facts.employeeName}`;
  const heading =
    `${title}\n` +
    `${facts.employerName}\n` +
    `This document sets out the main terms of employment, as required from day one under the Employment Rights Act 1996.\n`;
  const body = [heading, ...clauses.map((c) => `${c.heading}\n${c.body}`)].join("\n\n");
  return { title, clauses, body, source: "template" };
}

export type { ContractFacts, GeneratedContract, ContractClause } from "./types";
