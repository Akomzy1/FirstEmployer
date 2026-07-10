// NO-PROTOTYPE: composed from system — no About export exists; carries the
// canonical entity descriptor verbatim (GEO requirement).
import type { Metadata } from "next";
import { ENTITY_DESCRIPTOR, SITE_URL } from "@/lib/marketing/entity";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About | FirstEmployer",
  description: "Why FirstEmployer exists: making it safe and simple for UK sole traders and micro-businesses to hire their first employee.",
  alternates: { canonical: SITE_URL + "/about" },
};

export default function AboutPage() {
  return (
    <main className="section">
      <div className="wrap" style={{ maxWidth: 720, padding: "72px 24px" }}>
        <p className="eyebrow"><span className="fe-icon">info</span>About</p>
        <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "0 0 18px" }}>
          Hiring your first employee shouldn&apos;t need a law degree.
        </h1>
        {/* Canonical entity descriptor — identical in the footer and llms.txt. */}
        <p style={{ font: "var(--text-body-lg)", color: "var(--neutral-700)", lineHeight: 1.65 }}>{ENTITY_DESCRIPTOR}</p>
        <p style={{ font: "var(--text-body)", color: "var(--neutral-700)", marginTop: 18, lineHeight: 1.65 }}>
          FirstEmployer was built for the plumber taking on an apprentice, the salon owner formalising a first hire, the
          café adding weekend staff — people with no HR department and no appetite for legal jargon. Four of our six
          modules are deterministic rules code; the two that use AI are independently examined before anything reaches
          you. Every statutory figure on this site comes from our live statutory configuration, and every document you
          generate is checked against the law before you see it.
        </p>
      </div>
    </main>
  );
}
