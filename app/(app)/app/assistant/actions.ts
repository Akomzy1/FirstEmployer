"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { answerQuestion, type AssistantResponse } from "@/lib/ai/assistant";
import { loadGuidanceCorpus } from "@/lib/ai/guidance-corpus";
import { deriveDashboard, SEGMENT_SOURCES, type ObligationRowInput } from "@/lib/rules/obligations";
import { consumeToken, AI_LIMITS } from "@/lib/security/rate-limit";

export interface AskResult {
  threadId: string;
  response: AssistantResponse;
}

/**
 * Ask the assistant. Reads state (config + the obligations engine's output),
 * answers through the grounded core, and persists the exchange with its
 * grounding refs. The ONLY writes here are the chat thread and its messages —
 * the assistant has no path to business/compliance state (Rule 1: reads, never
 * mutates; deadlines are quoted from the engine, never computed).
 */
export async function askAssistant(question: string, threadId?: string): Promise<AskResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");

  // AI endpoints are rate-limited per business (P16 security pass).
  consumeToken(`${business.id}:assistant`, AI_LIMITS.assistant);

  const config = await getLiveConfig();

  // The obligations engine formats every date; the assistant only quotes them.
  const { data: obligations } = await supabase
    .from("obligations")
    .select("type, state, due_date")
    .eq("business_id", business.id);
  const rows = (obligations ?? []) as ObligationRowInput[];
  const dash = deriveDashboard({
    today: new Date().toISOString().slice(0, 10),
    ownerFirstName: "",
    hasDetermination: true,
    obligations: rows,
  });
  const obligationsContext = [
    `Compliance summary: ${dash.metCount} of ${dash.segments.length} obligations met.`,
    ...dash.segments
      .filter((s) => s.deadline)
      .map((s) => `${SEGMENT_SOURCES.find((x) => x.id === s.id)?.label}: ${s.deadline!.label} (${s.state}).`),
  ].join(" ");

  const response = await answerQuestion({
    question,
    config: config.values,
    configLabel: config.label,
    obligationsContext,
    corpus: loadGuidanceCorpus(),
  });

  // Persist the exchange (chat data only).
  let tid = threadId ?? null;
  if (!tid) {
    const { data: thread, error } = await supabase
      .from("assistant_threads")
      .insert({ business_id: business.id, title: question.slice(0, 80) })
      .select("id")
      .single();
    if (error) throw new Error(`thread create failed: ${error.message}`);
    tid = thread.id;
  }
  await supabase.from("assistant_messages").insert({ thread_id: tid, role: "user", content: question });
  const groundingRefs =
    response.kind === "answer"
      ? response.sources.map((s) => ({ label: s.label, url: s.url }))
      : response.kind === "signpost"
        ? response.sources.map((s) => ({ label: s.label, url: s.url }))
        : [{ label: "Acas helpline", url: "https://www.acas.org.uk/" }];
  await supabase.from("assistant_messages").insert({
    thread_id: tid,
    role: "assistant",
    content: response.kind === "boundary" ? `[boundary:${response.topic}] ${response.body}` : response.text,
    grounding_refs: groundingRefs,
  });

  return { threadId: tid!, response };
}
