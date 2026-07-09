import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/data/business";
import { StatusAdvisorFlow } from "@/components/app/status/StatusAdvisorFlow";

export const metadata = { title: "Status Advisor" };

export default async function StatusAdvisorPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  // Resume any in-progress check from the business journey state (FR-8.6).
  const draft = (business.journey_state?.status_advisor ?? {}) as {
    employeeId?: string;
    name?: string;
    step?: string;
    answers?: Record<string, string>;
    ambiguousAcknowledged?: boolean;
  };

  return <StatusAdvisorFlow initial={draft} />;
}
