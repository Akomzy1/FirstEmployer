/**
 * Server entry for the Examiner. Enforces the server boundary (`server-only`) and
 * re-exports the server-agnostic core. App code imports from here; tests import
 * the core directly. See `./examiner-core` for the implementation and the
 * independence guarantees (Rules 2 & 3).
 */
import "server-only";

export {
  examineContract,
  makeExaminer,
  EXAMINER_VERSION,
  type ExamineOptions,
  type ExaminerLanguageTransport,
} from "./examiner-core";
