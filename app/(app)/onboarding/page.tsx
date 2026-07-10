import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { buildGapQuestions } from "@/lib/content/gap-questions";
import { OnboardingFlow } from "@/components/app/onboarding/OnboardingFlow";
import type { OnboardingDraft } from "./actions";

export const metadata = { title: "Get set up" };

export default async function OnboardingPage({ searchParams }: { searchParams?: { gaps?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/onboarding");

  // Already onboarded → straight to the journey.
  const business = await getCurrentBusiness();
  if (business) redirect("/app");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_state")
    .eq("id", user.id)
    .maybeSingle();

  const draft = (profile?.onboarding_state ?? {}) as OnboardingDraft;

  // Readiness-check handoff (FR-8.2): ?gaps=rtw,paye pre-answers those gap
  // questions "no", so the already-employer path seeds the matching obligations.
  const gapsParam = typeof searchParams?.gaps === "string" ? searchParams.gaps : "";
  if (gapsParam && !draft.gapAnswers) {
    const valid = new Set(["insurance", "paye", "contract", "rtw", "pension", "records"]);
    const gapAnswers: Record<string, "yes" | "no"> = {};
    for (const id of gapsParam.split(",")) if (valid.has(id.trim())) gapAnswers[id.trim()] = "no";
    if (Object.keys(gapAnswers).length) draft.gapAnswers = gapAnswers;
  }

  // Gap-question copy assembled from live config (Rule 4) on the server, then
  // handed to the client flow so it never imports config directly.
  const config = await getLiveConfig();
  const gapQuestions = buildGapQuestions(config.values);

  return <OnboardingFlow initial={draft} gapQuestions={gapQuestions} />;
}
