"use client";

/* Readiness check (FR-8.1/8.2) — one question per screen on the app's radio-card
 * pattern, results with severity-ordered gaps, an email gate for the full
 * results, and the gaps handoff into onboarding via querystring. */
import { useEffect, useRef, useState } from "react";
import { Button, Icon, RadioCards, StepDots } from "@/components/system";
import { captureReadinessLead } from "@/app/(marketing)/readiness/actions";
import { fbqTrack, fbqTrackCustom, newMetaEventId } from "@/lib/meta/client";

export interface ReadinessQuestion {
  id: string;
  /** Maps to the onboarding gap id for the handoff ('' = no obligation seeded). */
  gapId: string;
  title: string;
  detail: string;
  yes: string;
  no: string;
  gapLabel: string;
  severity: number; // 1 = most serious first
}

const QUESTIONS: ReadinessQuestion[] = [
  { id: "status", gapId: "", title: "Do you know your new hire's employment status?", detail: "Employee, worker or self-employed — it decides every duty that follows.", yes: "Yes, it's settled", no: "Not sure yet", gapLabel: "Confirm employment status", severity: 1 },
  { id: "rtw", gapId: "rtw", title: "Will you check their right to work before day one?", detail: "A correct, recorded check is your legal defence.", yes: "Yes, I know how", no: "I don't know how", gapLabel: "Right to work check", severity: 2 },
  { id: "paye", gapId: "paye", title: "Are you registered as an employer with HMRC?", detail: "You must register before the first payday.", yes: "Already registered", no: "Not yet", gapLabel: "HMRC PAYE registration", severity: 3 },
  { id: "contract", gapId: "contract", title: "Will they have a written contract on day one?", detail: "A written statement of terms is a day-one legal right.", yes: "Yes, ready", no: "Not yet", gapLabel: "Written contract", severity: 4 },
  { id: "pension", gapId: "pension", title: "Do you have a workplace pension scheme ready?", detail: "Pension duties start on their first day.", yes: "Scheme ready", no: "Not yet", gapLabel: "Workplace pension", severity: 5 },
  { id: "insurance", gapId: "insurance", title: "Do you hold employers' liability insurance?", detail: "Required from the first day someone works for you.", yes: "Covered", no: "Not yet", gapLabel: "Employers' liability insurance", severity: 6 },
  { id: "payroll", gapId: "", title: "Do you have a way to run payroll?", detail: "Tax and National Insurance must be worked out and reported every payday.", yes: "Sorted", no: "Not yet", gapLabel: "Payroll", severity: 7 },
  { id: "records", gapId: "records", title: "Do you have somewhere safe to keep employment records?", detail: "Pay, holiday and right-to-work records have statutory retention periods.", yes: "Yes", no: "Not really", gapLabel: "Record keeping", severity: 8 },
];

type Step = "intro" | number | "email" | "results";

const STORE_KEY = "fe_readiness_draft";

export function ReadinessFlow() {
  // Pre-auth flow: per-step persistence is sessionStorage (FR-8.6 spirit — a
  // killed tab restores; server persistence starts at signup).
  const [step, setStepRaw] = useState<Step>("intro");
  const [answers, setAnswersRaw] = useState<Record<string, "yes" | "no">>({});
  // Ads measurement: the readiness check is the ad-funnel landing content.
  useEffect(() => {
    fbqTrack("ViewContent", { content_name: "readiness_check" });
  }, []);
  const funnelFired = useRef({ start: false, complete: false });
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { step?: Step; answers?: Record<string, "yes" | "no"> };
        if (d.answers) setAnswersRaw(d.answers);
        if (d.step !== undefined && d.step !== "results") setStepRaw(d.step);
      }
    } catch { /* fresh start */ }
  }, []);
  const setStep = (v: Step) => {
    setStepRaw(v);
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ step: v, answers })); } catch { /* best effort */ }
  };
  const setAnswers = (fn: (prev: Record<string, "yes" | "no">) => Record<string, "yes" | "no">) => {
    setAnswersRaw((prev) => {
      const next = fn(prev);
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ step, answers: next })); } catch { /* best effort */ }
      return next;
    });
  };
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gaps = QUESTIONS.filter((q) => answers[q.id] === "no").sort((a, b) => a.severity - b.severity);
  const score = QUESTIONS.length - gaps.length;
  const gapIds = gaps.map((g) => g.gapId).filter(Boolean);
  const onboardingHref = "/onboarding" + (gapIds.length ? `?gaps=${gapIds.join(",")}` : "");

  // Funnel steps (trackCustom, once per session each): first question rendered
  // → results screen reached. Lead fires separately on email capture.
  useEffect(() => {
    if (step === 0 && !funnelFired.current.start) {
      funnelFired.current.start = true;
      fbqTrackCustom("ReadinessCheckStart", { content_name: "readiness_check" });
    }
    if (step === "results" && !funnelFired.current.complete) {
      funnelFired.current.complete = true;
      fbqTrackCustom("ReadinessCheckComplete", { content_name: "readiness_check", score });
    }
  }, [step, score]);

  async function submitEmail() {
    setBusy(true);
    setError(null);
    try {
      // Dual-fire Lead (browser + Conversions API) with a shared id so Meta
      // deduplicates; the server side carries the hashed email for matching.
      const metaEventId = newMetaEventId();
      await captureReadinessLead({ email, score, gaps: gaps.map((g) => g.gapLabel), metaEventId });
      fbqTrack("Lead", { content_name: "readiness_check" }, metaEventId);
      setStep("results");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const wrap: React.CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "56px 24px 72px" };

  if (step === "intro") {
    return (
      <div style={wrap}>
        <span className="eyebrow" style={{ display: "inline-flex" }}><span className="fe-icon">fact_check</span> Readiness check</span>
        <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "10px 0 12px" }}>
          Are you ready to hire? Eight questions, two minutes.
        </h1>
        <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 0 24px" }}>
          Answer honestly — there are no wrong answers, only gaps to close. You&apos;ll get a plain-English list of exactly what&apos;s left to do.
        </p>
        <Button variant="primary" style={{ width: "100%" }} onClick={() => setStep(0)}>Start the check</Button>
        <p style={{ font: "var(--text-caption)", color: "var(--neutral-500)", textAlign: "center", marginTop: 12 }}>
          Free, no account needed. Your answers stay on this page until you choose to share them.
        </p>
      </div>
    );
  }

  if (typeof step === "number") {
    const q = QUESTIONS[step];
    return (
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <StepDots total={QUESTIONS.length} current={step} />
          <span className="fe-tabular" style={{ font: "var(--text-caption)", color: "var(--neutral-500)" }}>{step + 1} of {QUESTIONS.length}</span>
        </div>
        {/* a11y (P16): screen readers land on the new question after a step change */}
        <h1 key={step} tabIndex={-1} ref={(el) => el?.focus()} style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px", outline: "none" }}>{q.title}</h1>
        <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 20px" }}>{q.detail}</p>
        <RadioCards
          options={[
            { value: "yes", title: q.yes },
            { value: "no", title: q.no },
          ]}
          value={answers[q.id]}
          onChange={(v) => {
            setAnswers((prev) => ({ ...prev, [q.id]: v as "yes" | "no" }));
            setTimeout(() => setStep(step + 1 < QUESTIONS.length ? step + 1 : "email"), 180);
          }}
        />
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ border: "none", background: "none", cursor: "pointer", font: "600 15px/1 var(--font-body)", color: "var(--neutral-500)", marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="arrow_back" size={16} />Back
          </button>
        )}
      </div>
    );
  }

  if (step === "email") {
    return (
      <div style={wrap}>
        <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px" }}>Your results are ready</h1>
        <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 20px" }}>
          Pop in your email and we&apos;ll show them here and send you a copy — so the list doesn&apos;t vanish when the tab does.
        </p>
        <label className="fe-label" htmlFor="readiness-email">Email</label>
        <input id="readiness-email" type="email" className="fe-input" placeholder="you@yourbusiness.co.uk" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--red-600)", marginTop: 8 }}>{error}</p>}
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" style={{ width: "100%" }} loading={busy} disabled={!email.trim()} onClick={submitEmail}>
            Show my results
          </Button>
        </div>
        <p style={{ font: "var(--text-caption)", color: "var(--neutral-500)", textAlign: "center", marginTop: 12 }}>
          No spam — the results email and occasional plain-English updates. Unsubscribe any time.
        </p>
      </div>
    );
  }

  // results
  return (
    <div style={{ ...wrap, maxWidth: 620 }}>
      <span className="eyebrow" style={{ display: "inline-flex" }}><span className="fe-icon">fact_check</span> Your results</span>
      <h1 className="fe-tabular" style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "10px 0 8px" }}>
        {score} of {QUESTIONS.length} ready
      </h1>
      <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 0 24px" }}>
        {gaps.length === 0
          ? "You look ready. The app keeps you that way — every deadline monitored, every document examined."
          : `${gaps.length} gap${gaps.length === 1 ? "" : "s"} to close before your first hire — in this order.`}
      </p>
      {gaps.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
          {gaps.map((g, i) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: "14px 16px" }}>
              <span className="fe-tabular" style={{ width: 28, height: 28, borderRadius: 999, background: "var(--amber-50)", color: "var(--amber-700)", display: "grid", placeItems: "center", font: "600 13px/1 var(--font-body)", flex: "none" }}>{i + 1}</span>
              <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{g.gapLabel}</span>
            </div>
          ))}
        </div>
      )}
      <a className="fe-btn fe-btn--primary" style={{ width: "100%", boxSizing: "border-box" }} href={onboardingHref}>
        Close the gaps — start your free trial
      </a>
      <p style={{ font: "var(--text-caption)", color: "var(--neutral-500)", textAlign: "center", marginTop: 12 }}>
        7 days free, no card. Your gaps arrive pre-loaded so you start exactly where you are.
      </p>
    </div>
  );
}
