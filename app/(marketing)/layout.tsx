import "./marketing.css";
import { getLiveConfig } from "@/lib/config";
import { MarketingNav, MarketingFooter } from "@/components/marketing/Chrome";
import { ENTITY_DESCRIPTOR, SITE_NAME, SITE_URL } from "@/lib/marketing/entity";
import { getTier } from "@/lib/pricing";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const config = await getLiveConfig();
  // Sitewide Organization + SoftwareApplication structured data (SEO §5).
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      description: ENTITY_DESCRIPTOR,
      areaServed: "GB",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: ENTITY_DESCRIPTOR,
      offers: { "@type": "Offer", price: getTier("starter").price, priceCurrency: "GBP" },
    },
  ];
  return (
    <div className="mkt">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingNav />
      {children}
      <MarketingFooter configLabel={config.label} />
    </div>
  );
}
