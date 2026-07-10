import type { Metadata } from "next";
import { getLiveConfig } from "@/lib/config";
import { marketingVars } from "@/lib/marketing/vars";
import { FeatureStatusBody } from "@/components/marketing/pages/FeatureStatusBody";
import { SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Employment Status Advisor | FirstEmployer",
  description: "Employee, worker or self-employed? Twelve questions, a deterministic verdict with the case-law factors, and a stored determination document.",
  alternates: { canonical: SITE_URL + "/features/status-advisor" },
};

export default async function FeatureStatusPage() {
  const config = await getLiveConfig();
  return <main><FeatureStatusBody v={marketingVars(config)} /></main>;
}
