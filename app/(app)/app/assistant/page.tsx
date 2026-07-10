import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { deriveDashboard, type ObligationRowInput } from "@/lib/rules/obligations";
import { AssistantChat, type ContextCardData } from "@/components/app/assistant/AssistantChat";

export const metadata = { title: "Assistant" };

/** Deterministic context card (FR-6.4): the obligations engine picks the nearest
 *  deadline and this code phrases it. The assistant model is never involved. */
function buildContextCard(
  timeline: { date: string; label: string; segment: string }[],
  declarationMonths: number,
): ContextCardData | null {
  const next = timeline[0];
  if (!next) return null;
  const dateLabel = new Date(next.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  if (next.segment === "pension") {
    return {
      title: `Your pension declaration is due by ${dateLabel}`,
      body: `You need to tell The Pensions Regulator you've set up your workplace pension correctly — it's due within ${declarationMonths} months of your duties starting. It takes about ten minutes, and your setup step walks you through it.`,
      dueDate: next.date,
      source: { label: "The Pensions Regulator — Declaration of compliance", url: "https://www.thepensionsregulator.gov.uk/en/employers" },
      receipt: {
        reference: "Pensions Act 2008 s.11",
        plainEnglish: `Every employer must complete a declaration of compliance within ${declarationMonths} months of their duties starting, to confirm they've enrolled staff correctly. Miss it and the Regulator can fine you.`,
        guidanceUrl: "https://www.thepensionsregulator.gov.uk/en/employers",
      },
      actionLabel: "Take me to my pension setup",
    };
  }
  if (next.segment === "rtw") {
    return {
      title: `A right to work follow-up is due by ${dateLabel}`,
      body: "A worker's permission is time-limited, so a follow-up check is needed before it runs out to keep your legal defence. It's the same quick check as before.",
      dueDate: next.date,
      source: { label: "GOV.UK — Check a job applicant's right to work", url: "https://www.gov.uk/check-job-applicant-right-to-work" },
      receipt: {
        reference: "IANA 2006 s.15",
        plainEnglish: "A correct, dated check gives you a statutory excuse — a complete legal defence. When permission is time-limited, the defence needs a follow-up check before it expires.",
        guidanceUrl: "https://www.gov.uk/check-job-applicant-right-to-work",
      },
      actionLabel: "Take me to right to work",
    };
  }
  return {
    title: `${next.label} — due by ${dateLabel}`,
    body: "This is your nearest deadline. Your dashboard has the one-tap route to sort it.",
    dueDate: next.date,
    source: { label: "GOV.UK — Employing staff for the first time", url: "https://www.gov.uk/employing-staff" },
    receipt: null,
    actionLabel: "Take me to my dashboard",
  };
}

export default async function AssistantPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  const supabase = createClient();
  const [{ data: obligations }, config] = await Promise.all([
    supabase.from("obligations").select("type, state, due_date").eq("business_id", business.id),
    getLiveConfig(),
  ]);
  const dash = deriveDashboard({
    today: new Date().toISOString().slice(0, 10),
    ownerFirstName: "",
    hasDetermination: true,
    obligations: (obligations ?? []) as ObligationRowInput[],
  });
  const contextCard = buildContextCard(dash.timeline, config.values.pension.declaration_of_compliance_months);

  const starters = [
    { id: "p45", label: "What's a P45?", icon: "quiz" },
    { id: "pension", label: "When is my pension declaration due?", icon: "event" },
    { id: "cash", label: "Can I pay cash in hand?", icon: "payments" },
  ];

  return <AssistantChat contextCard={contextCard} starters={starters} />;
}
