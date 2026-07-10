import type { Metadata } from "next";
import { getLiveConfig } from "@/lib/config";
import { marketingVars } from "@/lib/marketing/vars";
import { PricingBody } from "@/components/marketing/pages/PricingBody";
import { TIERS } from "@/lib/pricing";
import { SITE_URL, SITE_NAME } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pricing — plans from £9.99/month | FirstEmployer",
  description: "Three simple monthly plans for UK first-time employers. 7-day free trial, no card required, cancel any time.",
  alternates: { canonical: SITE_URL + "/pricing" },
};

export default async function PricingPage() {
  const config = await getLiveConfig();
  // Product + Offer structured data (rich-results target).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SITE_NAME,
    description: "UK compliance platform for first-time employers.",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: TIERS.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: "GBP",
      url: SITE_URL + "/pricing",
      availability: "https://schema.org/InStock",
    })),
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PricingBody v={marketingVars(config)} />
    </main>
  );
}
