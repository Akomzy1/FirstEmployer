import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveConfig } from "@/lib/config";
import { loadSectors, substituteTokens } from "@/lib/marketing/content";
import { SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export function generateStaticParams() {
  return loadSectors().map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = loadSectors().find((x) => x.slug === params.slug);
  if (!s) return {};
  return {
    title: `${s.title} | FirstEmployer`,
    description: s.description,
    alternates: { canonical: `${SITE_URL}/sectors/${s.slug}` },
  };
}

export default async function SectorPage({ params }: { params: { slug: string } }) {
  const sector = loadSectors().find((s) => s.slug === params.slug);
  if (!sector) notFound();
  const config = await getLiveConfig();
  return (
    <main className="section">
      <div className="wrap" style={{ maxWidth: 760, padding: "56px 24px 72px" }}>
        <div className="ar-breadcrumb" style={{ marginBottom: 14 }}>
          <Link href="/">Home</Link> <span className="fe-icon" style={{ fontSize: 14 }}>chevron_right</span> Sectors
        </div>
        <span className="eyebrow" style={{ display: "inline-flex" }}><span className="fe-icon">storefront</span> {sector.name}</span>
        <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "10px 0 16px" }}>{sector.title}</h1>
        <div className="ar-answer">
          <span className="ar-answer__tag"><span className="fe-icon">bolt</span> The short answer</span>
          <p>{substituteTokens(sector.answerBox, config)}</p>
        </div>
        <div className="ar-body" dangerouslySetInnerHTML={{ __html: substituteTokens(sector.html, config) }} />
        <div style={{ marginTop: 28 }}>
          <Link className="fe-btn fe-btn--primary" href="/readiness">Check if you&apos;re ready to hire — free, 2 minutes</Link>
        </div>
        <p className="fe-tabular" style={{ font: "var(--text-caption)", color: "var(--neutral-500)", marginTop: 18 }}>
          Rates current as of config {config.label}.
        </p>
      </div>
    </main>
  );
}
