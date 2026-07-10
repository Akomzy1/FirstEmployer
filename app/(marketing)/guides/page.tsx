import type { Metadata } from "next";
import Link from "next/link";
import { loadGuides } from "@/lib/marketing/content";
import { SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Plain-English employer guides | FirstEmployer",
  description: "Every legal duty of hiring in the UK, explained at reading age 9 with the exact law behind each step.",
  alternates: { canonical: SITE_URL + "/guides" },
};

export default function GuidesHub() {
  const guides = loadGuides();
  return (
    <main className="section">
      <header className="wrap" style={{ textAlign: "center", padding: "64px 24px 30px" }}>
        <span className="eyebrow" style={{ display: "inline-flex" }}><span className="fe-icon">menu_book</span> Guides</span>
        <h1 style={{ font: "var(--text-display)", letterSpacing: "var(--tracking-display)", margin: "12px 0 10px" }}>
          Hiring, explained like a human
        </h1>
        <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto" }}>
          Every legal duty of taking someone on, in plain English — with the exact law behind each step so you can see it&apos;s real.
        </p>
      </header>
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, padding: "20px 24px 72px" }}>
        {guides.map((g) => (
          <Link key={g.slug} className="gh-card" href={`/guides/${g.slug}`}>
            <span className="gh-card__cat">{g.category}</span>
            <h3 className="gh-card__title">{g.title}</h3>
            <p className="gh-card__desc">{g.description}</p>
            <div className="gh-card__foot">
              <span><span className="fe-icon">schedule</span> {g.status === "live" ? "12 min" : "3 min"}</span>
              <span className="gh-card__fresh"><span className="fe-icon fe-icon--fill">verified</span> {g.lastReviewed ? new Date(g.lastReviewed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
