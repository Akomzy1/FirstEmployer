/**
 * Server entry for the Assistant. Enforces the server boundary and re-exports
 * the server-agnostic core (see `./assistant-core` for the grounding and
 * boundary guarantees). The assistant READS state and never mutates it — this
 * module exposes no write path of any kind.
 */
import "server-only";

export {
  answerQuestion,
  buildAssistantPrompt,
  validateAssistantResponse,
  ASSISTANT_VERSION,
  type AssistantInput,
  type AssistantResponse,
  type AssistantSource,
  type AssistantReceipt,
  type AssistantTransport,
} from "./assistant-core";
