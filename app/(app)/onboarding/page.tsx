import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { buildGapQuestions } from "@/lib/content/gap-questions";
import { OnboardingFlow } from "@/components/app/onboarding/OnboardingFlow";
import type { OnboardingDraft } from "./actions";

export const metadata = { title: "Get set up" };

export default async function OnboardingPage() {
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

  // Gap-question copy assembled from live config (Rule 4) on the server, then
  // handed to the client flow so it never imports config directly.
  const config = await getLiveConfig();
  const gapQuestions = buildGapQuestions(config.values);

  return <OnboardingFlow initial={draft} gapQuestions={gapQuestions} />;
}
