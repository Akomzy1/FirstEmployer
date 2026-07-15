"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GAP_META } from "@/lib/content/gap-questions";
import { sendMetaEvent } from "@/lib/meta/capi";
import type { TierId } from "@/lib/tiers";

export interface OnboardingDraft {
  path?: "hire" | "already";
  view?: string;
  gapIndex?: number;
  form?: { name?: string; structure?: string; sector?: string; tier?: TierId };
  gapAnswers?: Record<string, "yes" | "no">;
}

/**
 * Persist a partial onboarding draft to the caller's profile (FR-8.6 autosave).
 * Merges into profiles.onboarding_state so a killed tab resumes exactly.
 */
export async function saveOnboardingState(patch: OnboardingDraft): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarding_state")
    .eq("id", user.id)
    .maybeSingle();

  const merged = { ...(existing?.onboarding_state ?? {}), ...patch };

  await supabase.from("profiles").upsert({ id: user.id, onboarding_state: merged });
}

export interface FinishOnboardingInput {
  path: "hire" | "already";
  name: string;
  structure: "sole" | "ltd";
  sector: string;
  tier: TierId;
  gapAnswers?: Record<string, "yes" | "no">;
}

/**
 * Create the business (+ owner membership via RPC), and for the already-employer
 * path turn gap answers into obligation rows. Clears the onboarding draft.
 * Redirects to the journey home.
 */
export async function finishOnboarding(input: FinishOnboardingInput): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const businessType = input.structure === "ltd" ? "limited" : "sole_trader";

  const { data: businessId, error: rpcError } = await supabase.rpc("create_business_with_owner", {
    p_name: input.name.trim(),
    p_type: businessType,
    p_sector: input.sector || null,
    p_tier: input.tier,
    p_journey: {},
  });
  if (rpcError) throw new Error(`create business failed: ${rpcError.message}`);

  // Ads measurement (best-effort): the card-free 7-day trial starts at
  // business creation, so this is the ad funnel's deepest conversion event.
  await sendMetaEvent({
    eventName: "StartTrial",
    eventId: randomUUID(),
    email: user.email ?? undefined,
    customData: { content_name: "onboarding", tier: input.tier },
  });

  if (input.path === "already" && input.gapAnswers) {
    const rows = GAP_META.map((g) => {
      const answer = input.gapAnswers![g.id];
      return {
        business_id: businessId as string,
        type: g.obligationType,
        state: answer === "yes" ? "complete" : "not_started",
        source: "gap_check",
      };
    });
    const { error: obErr } = await supabase.from("obligations").insert(rows);
    if (obErr) throw new Error(`create obligations failed: ${obErr.message}`);
  }

  // Clear the draft now the business owns the journey state.
  await supabase.from("profiles").update({ onboarding_state: {} }).eq("id", user.id);

  redirect("/app");
}
