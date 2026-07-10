/** AI subsystem versions. Kept in a server-agnostic module so deterministic code
 *  (the pipeline, tests) can read them without importing a `server-only` module. */
export const GENERATOR_VERSION = "gen-1.0";
export const EXAMINER_VERSION = "exam-1.0";
