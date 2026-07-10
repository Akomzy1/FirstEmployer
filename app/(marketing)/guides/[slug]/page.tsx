import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveConfig } from "@/lib/config";
import { loadGuides, substituteTokens } from "@/lib/marketing/content";
import { SITE_URL, SITE_NAME } from "@/lib/marketing/entity";

export const revalidate = 3600;

export function generateStaticParams() {
  return loadGuides().map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = loadGuides().find((x) => x.slug === params.slug);
  if (!g) return {};
  return {
    title: `${g.title} | FirstEmployer`,
    description: g.description,
    alternates: { canonical: `${SITE_URL}/guides/${g.slug}` },
  };
}

export default async function GuideArticle({ params }: { params: { slug: string } }) {
  const guide = loadGuides().find((g) => g.slug === params.slug);
  if (!guide) notFound();
  const config = await getLiveConfig();
  const answer = substituteTokens(guide.answerBox, config);
  const html = substituteTokens(guide.html, config);
  const reviewed = guide.lastReviewed
    ? new Date(guide.lastReviewed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      author: { "@type": "Organization", name: SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME },
      dateModified: guide.lastReviewed,
      mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 2, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
      ],
    },
    ...(guide.toc.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: guide.title,
            description: answer,
            step: guide.toc.map((t, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: t.label,
              url: `${SITE_URL}/guides/${guide.slug}#${t.id}`,
            })),
          },
        ]
      : []),
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="ar-top wrap" style={{ padding: "40px 24px 0" }}>
        <div className="ar-breadcrumb">
          <Link href="/guides">Guides</Link> <span className="fe-icon" style={{ fontSize: 14 }}>chevron_right</span> {guide.category}
        </div>
        <header className="ar-head">
          <span className="ar-cat"><span className="fe-icon" style={{ fontSize: 15 }}>{guide.status === "live" ? "star" : "menu_book"}</span> {guide.status === "live" ? "Pillar guide · " : ""}{guide.category}</span>
          <h1 className="ar-h1">{guide.title}</h1>
          <div className="ar-meta">
            <span className="ar-fresh"><span className="fe-icon fe-icon--fill">verified</span> Last reviewed {reviewed}</span>
            <span className="fe-tabular">Rates current as of config {config.label}</span>
          </div>
        </header>
      </div>
      <div className="ar-layout wrap" style={{ padding: "10px 24px 72px" }}>
        {guide.toc.length > 0 && (
          <aside className="ar-toc">
            <p className="ar-toc__lab">On this page</p>
            <nav className="ar-toc__list">
              {guide.toc.map((t, i) => (
                <a key={t.id} href={`#${t.id}`}><span className="ar-toc__num">{String(i + 1).padStart(2, "0")}</span> {t.label}</a>
              ))}
            </nav>
          </aside>
        )}
        <article className="ar-body">
          {/* Answer-first summary box (GEO): the question answered immediately. */}
          <div className="ar-answer">
            <span className="ar-answer__tag"><span className="fe-icon">bolt</span> The short answer</span>
            <p>{answer}</p>
          </div>
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {guide.status === "stub" && (
            <p style={{ font: "var(--text-caption)", color: "var(--neutral-500)", marginTop: 24 }}>
              This guide is being expanded and solicitor-reviewed. The answer above is current as of config {config.label}.
            </p>
          )}
        </article>
      </div>
    </main>
  );
}
