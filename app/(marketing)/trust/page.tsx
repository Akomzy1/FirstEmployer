import type { Metadata } from "next";
import { getLiveConfig } from "@/lib/config";
import { marketingVars } from "@/lib/marketing/vars";
import { TrustBody } from "@/components/marketing/pages/TrustBody";
import { SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Trust & security | FirstEmployer",
  description: "How FirstEmployer protects your data: UK hosting, encryption, statutory retention honoured, and an independent examiner on every document.",
  alternates: { canonical: SITE_URL + "/trust" },
};

export default async function TrustPage() {
  const config = await getLiveConfig();
  return <main><TrustBody v={marketingVars(config)} /></main>;
}
