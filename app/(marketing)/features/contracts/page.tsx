import type { Metadata } from "next";
import { getLiveConfig } from "@/lib/config";
import { marketingVars } from "@/lib/marketing/vars";
import { FeatureContractsBody } from "@/components/marketing/pages/FeatureContractsBody";
import { SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Examined employment contracts | FirstEmployer",
  description: "Every contract is generated from your answers and independently examined against the statutory checklist before you ever see it.",
  alternates: { canonical: SITE_URL + "/features/contracts" },
};

export default async function FeatureContractsPage() {
  const config = await getLiveConfig();
  return <main><FeatureContractsBody v={marketingVars(config)} /></main>;
}
