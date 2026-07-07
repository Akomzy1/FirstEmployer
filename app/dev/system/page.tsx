"use client";

/**
 * /dev/system — every system component in every state, mirroring the sections
 * of /design/prototype/Style Reference (standalone).html for eyeball diffing.
 * Dev-only route; not linked from the product.
 *
 * Statutory rates in the prototype's demo copy are deliberately NOT reproduced
 * here (CLAUDE.md Rule 4: no statutory literals outside config seeds/tests) —
 * real screens render them from getLiveConfig via StatutoryReceipt props.
 */

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CurrencyInput,
  DateInput,
  DeadlineChip,
  DocumentCard,
  FileUpload,
  ObligationRow,
  ProgressBar,
  RadioCards,
  Select,
  StatusPill,
  StatutoryReceipt,
  StepDots,
  TextInput,
  VerificationSeal,
} from "@/components/system";

function RefSection({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ padding: "56px 0", borderTop: "1px solid var(--border-hairline)" }}>
      <div
        style={{
          font: "600 13px/1 var(--font-body)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--neutral-500)",
          marginBottom: 10,
        }}
      >
        {kicker}
      </div>
      <h2 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", marginBottom: 28 }}>{title}</h2>
      {children}
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "36px 0 16px" }}>{children}</h3>;
}

function Row({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: "flex", gap, flexWrap: "wrap", alignItems: "center" }}>{children}</div>;
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        font: "600 13px/1 var(--font-body)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        color: "var(--neutral-500)",
        margin: "0 0 12px",
      }}
    >
      {children}
    </div>
  );
}

function Swatch({
  name,
  hex,
  usage,
  bg,
  fg,
}: {
  name: string;
  hex: string;
  usage: string;
  bg: string;
  fg: string;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border-hairline)",
        background: bg,
        color: fg,
        padding: "14px 16px",
        minHeight: 118,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ font: "600 15px/1.2 var(--font-body)" }}>{name}</div>
        <div style={{ font: "400 13px/1.4 var(--font-body)", opacity: 0.8, marginTop: 4 }}>{usage}</div>
      </div>
      <div className="fe-tabular" style={{ font: "500 13px/1 var(--font-body)", opacity: 0.75 }}>
        {hex}
      </div>
    </div>
  );
}

function ColourSection() {
  return (
    <RefSection id="colour" kicker="1 · Colour tokens" title="Colour is a legal signal, not decoration">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <Swatch name="ink-900" hex="#0E1B2C" usage="Grounding dark. Text, secondary buttons, the legal-change banner." bg="var(--ink-900)" fg="var(--bone-50)" />
        <Swatch name="bone-50" hex="#F7F4EE" usage="Primary surface — never sterile white." bg="var(--bone-50)" fg="var(--ink-900)" />
        <Swatch name="verified-green-600" hex="#1E9E6A" usage="ONLY legally-true, compliant states and primary CTAs. Green is earned." bg="var(--verified-green-600)" fg="#fff" />
        <Swatch name="amber-500" hex="#D97A08" usage="Approaching deadline." bg="var(--amber-500)" fg="#fff" />
        <Swatch name="red-600" hex="#C0392B" usage="Overdue only. Calm, never shouting." bg="var(--red-600)" fg="#fff" />
        <Swatch name="terracotta-500" hex="#C56A4A" usage="Editorial warmth. Marketing only — never in compliance UI." bg="var(--terracotta-500)" fg="#fff" />
      </div>

      <SubHead>Neutral ramp — 5 steps between ink and bone</SubHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))", gap: 8 }}>
        {(
          [
            ["ink-900", "#0E1B2C", "var(--bone-50)"],
            ["neutral-700", "#2E3947", "var(--bone-50)"],
            ["neutral-500", "#5A626C", "var(--bone-50)"],
            ["neutral-400", "#83888E", "#fff"],
            ["neutral-200", "#C9C6BE", "var(--ink-900)"],
            ["neutral-100", "#EAE6DD", "var(--ink-900)"],
            ["bone-50", "#F7F4EE", "var(--ink-900)"],
          ] as const
        ).map(([n, h, fg]) => (
          <div
            key={n}
            style={{
              background: h,
              color: fg,
              borderRadius: 10,
              height: 74,
              padding: "8px 10px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <span style={{ font: "600 12px/1.2 var(--font-body)" }}>{n}</span>
            <span className="fe-tabular" style={{ font: "500 11px/1 var(--font-body)", opacity: 0.75 }}>
              {h}
            </span>
          </div>
        ))}
      </div>

      <SubHead>The state progression — green is earned</SubHead>
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", flexWrap: "wrap" }}>
        {(
          [
            ["Neutral", "Not due yet. Nothing to fear.", "var(--neutral-100)", "var(--neutral-700)"],
            ["Amber", "A deadline is approaching.", "var(--amber-50)", "var(--amber-700)"],
            ["Green", "Legally true. Verified. Earned.", "var(--verified-green-600)", "#fff"],
          ] as const
        ).map(([t, d, bg, fg], i) => (
          <span key={t} style={{ display: "contents" }}>
            {i > 0 && (
              <span className="fe-icon" style={{ alignSelf: "center", color: "var(--neutral-400)", fontSize: 22 }} aria-hidden="true">
                arrow_forward
              </span>
            )}
            <span style={{ flex: "1 1 160px", background: bg, color: fg, borderRadius: 12, padding: "18px 18px", border: "1px solid var(--border-hairline)", display: "block" }}>
              <span style={{ font: "600 17px/1.2 var(--font-body)", display: "block" }}>{t}</span>
              <span style={{ font: "400 15px/1.45 var(--font-body)", opacity: 0.85, marginTop: 4, display: "block" }}>{d}</span>
            </span>
          </span>
        ))}
      </div>
      <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", marginTop: 14, maxWidth: 620 }}>
        Green never appears until the state is legally true. No decorative green — the reward register is relief, not
        celebration.
      </p>
    </RefSection>
  );
}

function TypeSection() {
  const rows: Array<[string, React.CSSProperties, string]> = [
    ["Display · 44/1.08 · −2%", { font: "var(--text-display)", letterSpacing: "var(--tracking-display)" }, "Get to green"],
    ["H1 · 34/1.15", { font: "var(--text-h1)", letterSpacing: "var(--tracking-h)" }, "Hire your first employee without the fear"],
    ["H2 · 27/1.2", { font: "var(--text-h2)", letterSpacing: "var(--tracking-h)" }, "Your contract, checked by a real examiner"],
    ["H3 · 22/1.25", { font: "var(--text-h3)" }, "What happens next"],
    ["Body large · 19", { font: "var(--text-body-lg)" }, "You do not need to know employment law. That is our job."],
    ["Body · 17 minimum", { font: "var(--text-body)" }, "We will tell you what to do, when to do it, and why the law asks for it. Guidance copy is written at reading age 9, in en-GB."],
    ["Label · 15/600", { font: "var(--text-label)" }, "Employee's full name"],
    ["Caption · 13", { font: "var(--text-caption)", color: "var(--text-secondary)" }, "UI chrome only — receipts and timestamps, never guidance copy."],
  ];
  return (
    <RefSection id="type" kicker="2 · Type scale" title="Confident display, workhorse body">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map(([meta, style, sample]) => (
          <div key={meta} style={{ display: "flex", gap: 20, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="fe-tabular" style={{ font: "500 13px/1 var(--font-body)", color: "var(--neutral-500)", width: 170, flex: "none" }}>
              {meta}
            </span>
            <span style={{ ...style, minWidth: 0 }}>{sample}</span>
          </div>
        ))}
      </div>

      <SubHead>Tabular figures in all data UI</SubHead>
      <div className="fe-card" style={{ maxWidth: 560, padding: "8px 20px 4px", overflowX: "auto" }}>
        <table className="fe-tabular" style={{ borderCollapse: "collapse", width: "100%", font: "var(--text-body)" }}>
          <thead>
            <tr>
              {["Pay run", "Date", "Gross", "PAYE"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    font: "var(--text-caption)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--neutral-500)",
                    textAlign: i ? "right" : "left",
                    padding: "10px 8px",
                    borderBottom: "1px solid var(--border-hairline)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["March", "28/03/2026", "£1,846.15", "£118.40"],
              ["April", "25/04/2026", "£1,846.15", "£121.00"],
              ["May", "30/05/2026", "£2,011.54", "£154.20"],
            ].map((r, ri) => (
              <tr key={r[0]}>
                {r.map((c, i) => (
                  <td key={i} style={{ padding: "10px 8px", textAlign: i ? "right" : "left", borderBottom: ri < 2 ? "1px solid var(--border-hairline)" : "none" }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 10 }}>
        Currency and dates align vertically — tnum is on wherever numbers stack.
      </p>
    </RefSection>
  );
}

function ComponentsSection() {
  const [answer, setAnswer] = useState("regular");
  return (
    <RefSection id="components" kicker="3 · Core components" title="Named exactly, used everywhere">
      <SubHead>Buttons</SubHead>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Row>
          <Button variant="primary">Save and continue</Button>
          <Button variant="secondary">Back</Button>
          <Button variant="tertiary">Skip for now</Button>
          <Button variant="destructive">Delete record</Button>
        </Row>
        <Row>
          <Button variant="primary" loading>Saving…</Button>
          <Button variant="secondary" loading>Checking…</Button>
          <Button variant="primary" disabled>Save and continue</Button>
          <Button variant="secondary" disabled>Back</Button>
        </Row>
      </div>
      <p style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 12 }}>
        Primary is verified green — one per view. Destructive is rare and calm.
      </p>

      <SubHead>DeadlineChip</SubHead>
      <Row>
        <DeadlineChip grade="comfortable">Due in 4 months</DeadlineChip>
        <DeadlineChip grade="approaching">Due in 12 days</DeadlineChip>
        <DeadlineChip grade="urgent">Due in 3 days</DeadlineChip>
        <DeadlineChip grade="overdue">5 days overdue</DeadlineChip>
      </Row>

      <SubHead>StatutoryReceipt</SubHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "start" }}>
        <div>
          <Lbl>Collapsed (tap to expand)</Lbl>
          <p style={{ font: "var(--text-body)", margin: "0 0 8px" }}>
            Your employee must get a written statement of their terms on or before day one.{" "}
            <StatutoryReceipt
              reference="ERA 1996 s.1"
              plainEnglish="You must give your employee a written statement of their job terms. It has to be ready on or before their first day."
            />
          </p>
        </div>
        <div style={{ minHeight: 190 }}>
          <Lbl>Expanded</Lbl>
          <StatutoryReceipt
            defaultOpen
            reference="ERA 1996 s.1"
            plainEnglish="You must give your employee a written statement of their job terms. It has to be ready on or before their first day."
          />
        </div>
      </div>

      <SubHead>StatusPill</SubHead>
      <Row>
        <StatusPill status="not-started" />
        <StatusPill status="in-progress" />
        <StatusPill status="blocked" />
        <StatusPill status="complete" />
      </Row>

      <SubHead>Form inputs</SubHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22, alignItems: "start", maxWidth: 900 }}>
        <TextInput label="Employee's full name" placeholder="e.g. Priya Shah" hint="As it appears on their passport" />
        <Select label="How often will you pay them?" options={["Weekly", "Every 4 weeks", "Monthly"]} />
        <DateInput label="First day of work" hint="Their contract must be ready by this date" />
        <CurrencyInput
          label="Hourly pay"
          defaultValue="7.50"
          error="Below the minimum wage for an apprentice"
          receipt={
            <StatutoryReceipt
              reference="NMWA 1998"
              plainEnglish="Everyone you employ must be paid at least the minimum wage for their age band. The current rates come from your live rate card."
            />
          }
        />
        <RadioCards
          label="What kind of work will they do?"
          value={answer}
          onChange={setAnswer}
          options={[
            { value: "regular", title: "Regular hours every week", description: "Same days, same times" },
            { value: "varies", title: "Hours change week to week" },
          ]}
        />
        <FileUpload label="Their passport or share code" hint="Take a photo or choose a file" fileTypes="PDF, JPG or PNG" />
      </div>

      <SubHead>Cards</SubHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22, alignItems: "start", paddingTop: 14 }}>
        <Card title="Your next step">Register as an employer with HMRC before Priya&apos;s first payday.</Card>
        <DocumentCard
          title="Employment contract — Priya Shah"
          meta="Created 12 Mar 2026 · 4 pages"
          verified
          sealProps={{ timestamp: "14 Mar 2026, 09:41", hash: "3F9A-C21E" }}
        >
          <Button variant="tertiary">View contract</Button>
        </DocumentCard>
      </div>
      <div style={{ marginTop: 22, maxWidth: 760 }}>
        <Lbl>Obligation rows</Lbl>
        <ObligationRow name="Register for PAYE with HMRC" status="in-progress" grade="approaching" deadline="Due in 12 days" />
        <ObligationRow name="Employer's liability insurance" status="complete" />
        <ObligationRow name="Pension auto-enrolment" status="not-started" grade="comfortable" deadline="Due in 4 months" />
        <ObligationRow name="Right-to-work check" status="blocked" grade="urgent" deadline="Due in 3 days" />
      </div>

      <SubHead>Alerts &amp; banners</SubHead>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760 }}>
        <Alert kind="info" title="We check this for you">HMRC usually replies within 5 working days.</Alert>
        <Alert kind="warning" title="Pension deadline is getting close">You have 12 days to set up auto-enrolment for Priya.</Alert>
        <Alert kind="success" title="Your contract is legally compliant.">Nothing more to do here.</Alert>
        <Alert
          kind="legal-change"
          title="Minimum wage rises on 1 April"
          action={
            <Button variant="secondary" style={{ borderColor: "var(--bone-50)", color: "var(--bone-50)" }}>
              See what changed
            </Button>
          }
        >
          We&apos;ve re-checked Priya&apos;s pay. One thing needs your attention.
        </Alert>
      </div>

      <SubHead>Progress</SubHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, alignItems: "start", maxWidth: 760 }}>
        <ProgressBar label="Employer setup" value={64} savedText="Saved just now" />
        <ProgressBar label="Employer setup" value={100} savedText="All answers saved" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
          <StepDots total={6} current={2} />
          <span style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>Step 3 of 6</span>
        </div>
      </div>

      <SubHead>VerificationSeal</SubHead>
      <Row gap={28}>
        <VerificationSeal timestamp="14 Mar 2026, 09:41" hash="3F9A-C21E" />
        <VerificationSeal size={84} timestamp="14 Mar 2026" hash="3F9A" />
        <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 380, margin: 0 }}>
          Stamped on examiner-approved documents. Timestamp and short hash make the approval checkable. Rotated
          slightly — a stamp, not a badge.
        </p>
      </Row>
    </RefSection>
  );
}

function VoiceSection() {
  return (
    <RefSection id="voice" kicker="4 · Voice" title="Reassure first, explain second">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, maxWidth: 900 }}>
        <div className="fe-card">
          <div style={{ font: "600 13px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--verified-green-700)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span className="fe-icon" style={{ fontSize: 16 }} aria-hidden="true">check</span>Write this
          </div>
          <p style={{ font: "var(--text-body-lg)", margin: 0 }}>
            Nothing&apos;s lost — we saved your answers. Let&apos;s pick up where you stopped.
          </p>
          <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)", marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--neutral-200)" }}>
            Reassures first. Plain words, reading age 9. Ends with the way forward. No blame.
          </p>
        </div>
        <div className="fe-card">
          <div style={{ font: "600 13px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--red-600)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span className="fe-icon" style={{ fontSize: 16 }} aria-hidden="true">close</span>Never this
          </div>
          <p style={{ font: "var(--text-body-lg)", margin: 0, color: "var(--neutral-500)" }}>
            Error 502: Session terminated unexpectedly. Your submission could not be processed. Please try again.
          </p>
          <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)", marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--neutral-200)" }}>
            Leads with a code, uses jargon (&quot;session&quot;, &quot;processed&quot;), never says the work is safe, and
            &quot;unexpectedly&quot; creates fear.
          </p>
        </div>
      </div>
    </RefSection>
  );
}

function MobileSection() {
  const [answer, setAnswer] = useState("regular");
  const frame: React.CSSProperties = {
    width: 375,
    maxWidth: "100%", // prototype fixes 375px; capped so the showcase itself passes the no-horizontal-scroll gate at 375
    flex: "none",
    background: "var(--bone-50)",
    border: "1px solid var(--border-hairline)",
    borderRadius: 24,
    boxShadow: "var(--shadow-card)",
    overflow: "hidden",
  };
  return (
    <RefSection id="mobile" kicker="Mobile · 375px" title="How it reads on a phone">
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={frame}>
          <div style={{ padding: "22px 20px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <StepDots total={6} current={2} />
              <span style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>Step 3 of 6</span>
            </div>
            <h3 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", marginBottom: 8 }}>
              What kind of work will they do?
            </h3>
            <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 18px" }}>
              This decides which contract you need.{" "}
              <StatutoryReceipt
                reference="ERA 1996 s.230"
                plainEnglish="The law treats workers and employees differently. Their rights depend on which one they are."
              />
            </p>
            <RadioCards
              value={answer}
              onChange={setAnswer}
              options={[
                { value: "regular", title: "Regular hours every week", description: "Same days, same times" },
                { value: "varies", title: "Hours change week to week" },
                { value: "casual", title: "Only when I need them" },
              ]}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              <Button variant="primary" style={{ width: "100%" }}>Save and continue</Button>
              <Button variant="tertiary" style={{ width: "100%" }}>Back</Button>
            </div>
          </div>
        </div>
        <div style={frame}>
          <div style={{ padding: "22px 20px 28px" }}>
            <h3 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", marginBottom: 4 }}>Your obligations</h3>
            <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 16px" }}>
              Two things need you this month.
            </p>
            <div style={{ marginBottom: 18 }}>
              <ProgressBar label="Getting to green" value={64} savedText="Saved just now" />
            </div>
            <Alert kind="warning" title="Pension deadline is getting close">You have 12 days to set up auto-enrolment.</Alert>
            <div style={{ marginTop: 6 }}>
              <ObligationRow name="Register for PAYE" status="in-progress" grade="approaching" deadline="Due in 12 days" />
              <ObligationRow name="Liability insurance" status="complete" />
              <ObligationRow name="Pension auto-enrolment" status="not-started" grade="comfortable" deadline="Due in 4 months" />
            </div>
          </div>
        </div>
      </div>
      <p style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 16 }}>
        One question per screen. Tap targets ≥ 44px. Chips wrap under the row name if space runs out.
      </p>
    </RefSection>
  );
}

export default function SystemPage() {
  return (
    <>
      <header style={{ background: "var(--ink-900)", color: "var(--bone-50)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "64px 24px 56px" }}>
          <div style={{ font: "600 14px/1 var(--font-body)", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.65, marginBottom: 16 }}>
            FirstEmployer design system
          </div>
          <h1 style={{ font: "var(--text-display)", letterSpacing: "var(--tracking-display)", maxWidth: 620 }}>Get to Green</h1>
          <p style={{ font: "var(--text-body-lg)", opacity: 0.85, maxWidth: 560, margin: "16px 0 0" }}>
            The product design system for first-time employers. Calm, plain-English, mobile-first. Green means legally
            true — it is earned, never decorative. Reward is relief, not celebration.
          </p>
        </div>
      </header>
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px 80px" }}>
        <ColourSection />
        <TypeSection />
        <ComponentsSection />
        <VoiceSection />
        <MobileSection />
      </main>
    </>
  );
}
