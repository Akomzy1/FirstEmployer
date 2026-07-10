import type { Metadata } from "next";
import { getLiveConfig } from "@/lib/config";
import { CalculatorFlow } from "@/components/marketing/CalculatorFlow";
import { SITE_URL } from "@/lib/marketing/entity";

export const metadata: Metadata = {
  title: "True cost of hiring calculator | FirstEmployer",
  description: "Wages, employer National Insurance and the minimum workplace pension — the real annual cost of your first employee, on live statutory rates.",
  alternates: { canonical: SITE_URL + "/calculator" },
};

export default async function CalculatorPage({ searchParams }: { searchParams: { rate?: string; hours?: string } }) {
  const config = await getLiveConfig();
  return (
    <main className="section">
      <CalculatorFlow
        config={config.values}
        configLabel={config.label}
        initialRate={searchParams.rate}
        initialHours={searchParams.hours}
      />
    </main>
  );
}
