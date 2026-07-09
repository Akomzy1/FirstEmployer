"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Button,
  Icon,
  RadioCards,
  Select,
  StatutoryReceipt,
  StepDots,
  TextInput,
} from "@/components/system";
import { TIERS } from "@/lib/pricing";
import { SEVERITY_META, type GapQuestion } from "@/lib/content/gap-questions";
import { OnbEyebrow, OnbFooter, OnbHeader, OnbScroll, OnbTopBar, onbWrap } from "./scaffold";
import { finishOnboarding, saveOnboardingState, type OnboardingDraft } from "@/app/(app)/onboarding/actions";

type View = "fork" | "basics" | "tier" | "trial" | "gapq" | "gapreport";
type Path = "hire" | "already";
type Answer = "yes" | "no";

interface Form {
  name: string;
  structure: "" | "sole" | "ltd";
  sector: string;
  tier: (typeof TIERS)[number]["id"];
}

const SECTOR_OPTIONS = [
  "Choose your sector",
  "Plumbing & heating",
  "Electrical & building",
  "Salon & beauty",
  "Café & food",
  "Takeaway & delivery",
  "Retail shop",
  "Cleaning & maintenance",
  "Other trade or service",
];

export function OnboardingFlow({
  initial,
  gapQuestions,
}: {
  initial: OnboardingDraft;
  gapQuestions: GapQuestion[];
}) {
  const total = gapQuestions.length;
  const [view, setView] = useState<View>((initial.view as View) || "fork");
  const [path, setPath] = useState<Path | null>(initial.path ?? null);
  const [gapIndex, setGapIndex] = useState(initial.gapIndex ?? 0);
  const [form, setForm] = useState<Form>({
    name: initial.form?.name ?? "",
    structure: (initial.form?.structure as Form["structure"]) ?? "",
    sector: initial.form?.sector ?? "",
    tier: initial.form?.tier ?? "launch",
  });
  const [gapAnswers, setGapAnswers] = useState<Record<string, Answer>>(initial.gapAnswers ?? {});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  // Autosave the draft (FR-8.6). Fire-and-forget; surfaces a "Saved" indicator.
  const persist = useCallback((patch: OnboardingDraft) => {
    saveOnboardingState(patch)
      .then(() => setSavedAt(Date.now()))
      .catch(() => {});
  }, []);

  function go(next: View, patch: OnboardingDraft = {}) {
    setView(next);
    persist({ view: next, ...patch });
  }

  function finish(finalPath: Path) {
    startTransition(async () => {
      await finishOnboarding({
        path: finalPath,
        name: form.name,
        structure: form.structure === "ltd" ? "ltd" : "sole",
        sector: form.sector,
        tier: finalPath === "already" ? "starter" : form.tier,
        gapAnswers,
      });
    });
  }

  function answerGap(v: Answer) {
    const id = gapQuestions[gapIndex].id;
    const nextAnswers = { ...gapAnswers, [id]: v };
    setGapAnswers(nextAnswers);
    persist({ gapAnswers: nextAnswers, gapIndex, view: "gapq" });
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (gapIndex < total - 1) {
        const ni = gapIndex + 1;
        setGapIndex(ni);
        persist({ gapIndex: ni, view: "gapq" });
      } else {
        go("gapreport");
      }
    }, 260);
  }

  const savedNote =
    savedAt !== null ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <Icon name="check" size={15} style={{ color: "var(--verified-green-600)" }} />
        Saved
      </span>
    ) : null;

  // ---- Screens ----
  if (view === "fork") {
    return (
      <Frame>
        <OnbTopBar />
        <OnbScroll innerKey="fork" pad="0 20px 32px">
          <div style={onbWrap(720)}>
            <OnbHeader
              eyebrow="Welcome"
              title="Let's get you set up the right way"
              lede="Tell us where you are. We'll build a checklist that fits your business — and only show you what you actually need to do."
            />
            <div style={{ display: "grid", gap: 16 }}>
              <ScenarioCard
                primary
                mark="person_add"
                tag="Most people"
                title="I'm about to hire my first employee"
                blurb="You've never had staff before. We'll walk you through every legal step, in order, from status check to first payday."
                points={["A clear checklist, start to finish", "Nothing skipped, nothing scary", "Contract checked by an examiner"]}
                onClick={() => { setPath("hire"); go("basics", { path: "hire" }); }}
              />
              <ScenarioCard
                mark="groups"
                tag="Fast path"
                title="I already employ people"
                blurb="You've hired before. Answer six quick questions and we'll show you exactly where you stand, and what to fix."
                points={["A two-minute gap check", "See what's already sorted", "Only the gaps that matter"]}
                onClick={() => { setPath("already"); go("basics", { path: "already" }); }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 26, font: "var(--text-caption)", color: "var(--text-secondary)" }}>
              <Icon name="lock" size={15} />
              Your answers are saved as you go. No card needed to start.
            </div>
          </div>
        </OnbScroll>
      </Frame>
    );
  }

  if (view === "basics") {
    const ready = form.name.trim() && form.structure && form.sector;
    const next = path === "already" ? "gapq" : "tier";
    return (
      <Frame>
        <OnbTopBar
          onBack={() => go("fork")}
          label="About you"
          progress={path === "hire" ? <StepDots total={3} current={0} /> : savedNote}
        />
        <OnbScroll innerKey="basics" pad="0 20px 32px">
          <div style={onbWrap(540)}>
            <OnbHeader title="Tell us about your business" lede="Three quick things. This shapes the checklist we build for you." />
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <TextInput
                label="Business name"
                placeholder="e.g. DO Plumbing & Heating"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div>
                <RadioCards
                  label="How is your business set up?"
                  value={form.structure}
                  onChange={(v) => setForm({ ...form, structure: v as Form["structure"] })}
                  options={[
                    { value: "sole", title: "Sole trader", description: "It's just you — you and the business are the same in law." },
                    { value: "ltd", title: "Limited company", description: "A registered company (Ltd) that's separate from you." },
                  ]}
                />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12, background: "rgba(14,27,44,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                  <Icon name="info" size={19} style={{ color: "var(--ink-900)", flex: "none", marginTop: 1 }} />
                  <div style={{ font: "500 15px/1.45 var(--font-body)", color: "var(--ink-900)" }}>
                    This changes your checklist. A limited company must run PAYE and may need to auto-enrol you as well as your staff.{" "}
                    <StatutoryReceipt
                      reference="PAYE Regs 2003"
                      plainEnglish="Both sole traders and companies who pay staff must register with HMRC for PAYE. A limited company also has the director on the payroll."
                      guidanceUrl="https://www.gov.uk/register-employer"
                    />
                  </div>
                </div>
              </div>
              <Select
                label="What do you do?"
                hint="We use this to pick the right insurance and pay rules."
                options={SECTOR_OPTIONS}
                value={form.sector || "Choose your sector"}
                onChange={(e) => setForm({ ...form, sector: e.target.value === "Choose your sector" ? "" : e.target.value })}
              />
            </div>
          </div>
        </OnbScroll>
        <OnbFooter>
          <div style={onbWrap(540)}>
            <Button variant="primary" style={{ width: "100%" }} disabled={!ready} onClick={() => go(next, { form })}>
              Continue
            </Button>
          </div>
        </OnbFooter>
      </Frame>
    );
  }

  if (view === "tier") {
    return (
      <Frame>
        <OnbTopBar onBack={() => go("basics")} label="Choose a plan" progress={<StepDots total={3} current={1} />} />
        <OnbScroll innerKey="tier" pad="0 20px 32px">
          <div style={onbWrap(540)}>
            <OnbHeader
              title="Pick the plan that fits"
              lede="Start on a 7-day free trial — no card needed. Change or cancel any time. A high-street accountant would charge £500 to £2,000 for the same setup."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
              {TIERS.map((t) => (
                <TierCard key={t.id} tier={t} selected={form.tier === t.id} onSelect={() => setForm({ ...form, tier: t.id })} />
              ))}
            </div>
          </div>
        </OnbScroll>
        <OnbFooter note="You won't be charged today. We'll remind you two days before the trial ends.">
          <div style={onbWrap(540)}>
            <Button variant="primary" style={{ width: "100%" }} onClick={() => go("trial", { form })}>
              Start my free trial
            </Button>
          </div>
        </OnbFooter>
      </Frame>
    );
  }

  if (view === "trial") {
    return (
      <Frame>
        <OnbTopBar />
        <OnbScroll innerKey="trial" pad="0 20px 32px">
          <div style={{ ...onbWrap(480), textAlign: "center", paddingTop: 30 }}>
            <div style={{ width: 72, height: 72, borderRadius: 999, background: "var(--verified-green-50)", display: "grid", placeItems: "center", margin: "0 auto 22px" }}>
              <Icon name="check" size={40} fill style={{ color: "var(--verified-green-700)" }} />
            </div>
            <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px", textWrap: "balance" }}>
              You&apos;re all set{form.name ? `, ${form.name}` : ""}
            </h1>
            <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 0 30px", textWrap: "pretty" }}>
              Your 7 days start today. Let&apos;s build your checklist and get you to green.
            </p>
            <Button variant="primary" style={{ width: "100%" }} loading={pending} onClick={() => finish("hire")}>
              Start step 1
            </Button>
          </div>
        </OnbScroll>
      </Frame>
    );
  }

  if (view === "gapq") {
    const item = gapQuestions[gapIndex];
    return (
      <Frame>
        <OnbTopBar
          onBack={() => (gapIndex > 0 ? (setGapIndex(gapIndex - 1), persist({ gapIndex: gapIndex - 1 })) : go("basics"))}
          label={`Question ${gapIndex + 1} of ${total}`}
          progress={<StepDots total={total} current={gapIndex} />}
        />
        <OnbScroll innerKey={"gapq" + gapIndex} pad="0 20px 32px">
          <div style={onbWrap(540)}>
            <OnbHeader eyebrow="Where you stand" title={item.q} lede={item.help} size="h2" />
            <div style={{ marginBottom: 18 }}>
              <StatutoryReceipt reference={item.receipt.ref} plainEnglish={item.receipt.plain} guidanceUrl={item.receipt.url} />
            </div>
            <RadioCards
              label={item.q}
              value={gapAnswers[item.id]}
              onChange={(v) => answerGap(v as Answer)}
              options={[{ value: "yes", title: item.yes }, { value: "no", title: item.no }]}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 22, font: "var(--text-caption)", color: "var(--text-secondary)" }}>
              <Icon name="check" size={15} style={{ color: "var(--verified-green-600)" }} />
              Saved as you go — you can stop and come back.
            </div>
          </div>
        </OnbScroll>
      </Frame>
    );
  }

  // gapreport
  const gaps = gapQuestions
    .filter((q) => gapAnswers[q.id] === "no" && q.gapTitle)
    .sort((a, b) => SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order);
  const solidQs = gapQuestions.filter((q) => gapAnswers[q.id] === "yes");
  const solid = solidQs.length;
  return (
    <Frame>
      <OnbTopBar onBack={() => { setGapIndex(total - 1); go("gapq"); }} label="Your gap report" />
      <OnbScroll innerKey="gapreport" pad="0 20px 32px">
        <div style={onbWrap(560)}>
          <header style={{ margin: "20px 0 22px" }}>
            <OnbEyebrow>Where you stand today</OnbEyebrow>
            <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0, textWrap: "balance" }}>
              You&apos;re solid on <span className="fe-tabular">{solid}</span> of <span className="fe-tabular">{total}</span>. Let&apos;s fix these {gaps.length}.
            </h1>
            <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "12px 0 0", textWrap: "pretty" }}>
              Good news first — most of your basics are already in place. Here&apos;s what&apos;s left, most urgent at the top. We&apos;ve added each one to your setup checklist.
            </p>
          </header>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {solidQs.map((q) => (
              <span key={q.id} className="fe-pill fe-status--complete">
                <Icon name="check" size={15} />
                {q.short}
              </span>
            ))}
          </div>
          <OnbEyebrow>What to fix · {gaps.length} items</OnbEyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gaps.map((item, i) => (
              <GapCard key={item.id} item={item} n={i + 1} />
            ))}
          </div>
        </div>
      </OnbScroll>
      <OnbFooter note="No card needed — these are on your free Starter checklist.">
        <div style={onbWrap(560)}>
          <Button variant="primary" style={{ width: "100%" }} loading={pending} onClick={() => finish("already")}>
            Add to my setup checklist
          </Button>
        </div>
      </OnbFooter>
    </Frame>
  );
}

/** Full-height column that fills the onboarding viewport. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {children}
    </div>
  );
}

function ScenarioCard({
  mark,
  title,
  blurb,
  points,
  tag,
  primary,
  onClick,
}: {
  mark: string;
  title: string;
  blurb: string;
  points: string[];
  tag?: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: "var(--surface-raised)",
        border: primary ? "2px solid var(--ink-900)" : "1.5px solid var(--neutral-200)",
        borderRadius: "var(--radius-card)",
        boxShadow: primary ? "var(--shadow-popover)" : "var(--shadow-card)",
        padding: "23px 24px 25px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: primary ? "var(--ink-900)" : "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
          <Icon name={mark} size={28} fill={primary} style={{ color: primary ? "var(--verified-green-600)" : "var(--ink-900)" }} />
        </div>
        {tag && (
          <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.05em", color: primary ? "var(--verified-green-700)" : "var(--neutral-500)", background: primary ? "var(--verified-green-50)" : "var(--neutral-100)", padding: "6px 11px", borderRadius: 999, marginTop: 4 }}>
            {tag}
          </span>
        )}
      </div>
      <h2 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px", textWrap: "balance" }}>{title}</h2>
      <p style={{ font: "var(--text-body)", fontSize: 16, color: "var(--text-secondary)", margin: "0 0 16px", textWrap: "pretty" }}>{blurb}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        {points.map((p, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, font: "500 15px/1.4 var(--font-body)", color: "var(--ink-900)" }}>
            <Icon name="check" size={18} style={{ color: "var(--verified-green-600)", flex: "none", marginTop: 1 }} />
            {p}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 20, font: "600 16px/1 var(--font-body)", color: "var(--ink-900)" }}>
        {primary ? "Start here" : "Continue"}
        <Icon name="arrow_forward" size={20} />
      </div>
    </button>
  );
}

function TierCard({
  tier,
  selected,
  onSelect,
}: {
  tier: (typeof TIERS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const hi = tier.highlight;
  return (
    <button
      onClick={onSelect}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        background: "var(--surface-raised)",
        border: selected ? "2px solid var(--ink-900)" : hi ? "2px solid var(--verified-green-600)" : "1.5px solid var(--neutral-200)",
        borderRadius: "var(--radius-card)",
        boxShadow: hi ? "var(--shadow-popover)" : "var(--shadow-card)",
        padding: "22px 22px 24px",
      }}
    >
      {hi && (
        <span style={{ position: "absolute", top: -12, left: 22, font: "600 11px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", background: "var(--verified-green-600)", padding: "6px 12px", borderRadius: 999 }}>
          7-day free trial
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
        <span style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)" }}>{tier.name}</span>
        <span style={{ width: 24, height: 24, borderRadius: 999, border: selected ? "none" : "2px solid var(--neutral-200)", background: selected ? "var(--ink-900)" : "transparent", display: "grid", placeItems: "center", flex: "none" }}>
          {selected && <Icon name="check" size={16} style={{ color: "#fff" }} />}
        </span>
      </div>
      <div className="fe-tabular" style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 2 }}>
        <span style={{ font: "600 30px/1 var(--font-display)", letterSpacing: "-0.02em", color: "var(--ink-900)" }}>£{tier.price}</span>
        <span style={{ font: "500 15px/1 var(--font-body)", color: "var(--neutral-500)" }}>/ month</span>
      </div>
      <div style={{ font: "500 15px/1.35 var(--font-body)", color: "var(--text-secondary)", margin: "8px 0 14px" }}>{tier.tagline}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, font: "400 15px/1.4 var(--font-body)", color: "var(--ink-900)" }}>
            <Icon name="check" size={17} style={{ color: hi ? "var(--verified-green-600)" : "var(--neutral-500)", flex: "none", marginTop: 1 }} />
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

function GapCard({ item, n }: { item: GapQuestion; n: number }) {
  const sev = SEVERITY_META[item.severity];
  return (
    <div className="fe-card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <span className={"fe-pill " + sev.chip} style={{ minHeight: 28 }}>
          <Icon name={sev.icon} size={15} />
          {sev.label}
        </span>
        <span className="fe-tabular" style={{ font: "600 13px/1 var(--font-body)", color: "var(--neutral-400)" }}>Gap {n}</span>
      </div>
      <h3 style={{ font: "600 19px/1.25 var(--font-body)", letterSpacing: "var(--tracking-h)", margin: "0 0 6px", color: "var(--ink-900)" }}>{item.gapTitle}</h3>
      <p style={{ font: "400 15px/1.5 var(--font-body)", color: "var(--text-secondary)", margin: "0 0 12px", textWrap: "pretty" }}>{item.gapWhy}</p>
      <StatutoryReceipt reference={item.receipt.ref} plainEnglish={item.receipt.plain} guidanceUrl={item.receipt.url} />
    </div>
  );
}
