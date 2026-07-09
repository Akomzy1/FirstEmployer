/**
 * Claude model configuration (CLAUDE.md §4 — locked stack). Generation and
 * examination both run at temperature 0 for determinism. Change the model in one
 * place only.
 */
export const GENERATION_MODEL = "claude-sonnet-4-6";
export const EXAMINATION_MODEL = "claude-sonnet-4-6";
export const ZERO_TEMPERATURE = 0;
