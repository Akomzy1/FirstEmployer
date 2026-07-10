import type { Metadata } from "next";
import { getLiveConfig } from "@/lib/config";
import { marketingVars } from "@/lib/marketing/vars";
import { HomeBody } from "@/components/marketing/pages/HomeBody";
import { SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hire your first employee legally | FirstEmployer",
  description:
    "One guided path through every legal duty of hiring in the UK — status checks, PAYE, an examined contract, right to work, pension and a live compliance dashboard.",
  alternates: { canonical: SITE_URL + "/" },
};

export default async function MarketingHome() {
  const config = await getLiveConfig();
  return <main><HomeBody v={marketingVars(config)} /></main>;
}
