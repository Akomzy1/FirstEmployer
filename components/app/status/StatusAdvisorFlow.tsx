"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, RadioCards, StatutoryReceipt, StepDots } from "@/components/system";
import {
  determineStatus,
  QUESTIONS,
  VERDICT_LABEL,
  type Confidence,
  type Determination,
  type StatusAnswers,
} from "@/lib/rules/status";
import {
  acknowledgeAmbiguous,
  recordDetermination,
  saveStatusDraft,
  startStatusAdvisor,
} from "@/app/(app)/app/status-advisor/actions";

type Step = "intro" | "name" | "verdict" | "interstitial" | "determination" | `q${number}`;

interface Draft {
  employeeId?: string;
  name?: string;
  step?: string;
  answers?: StatusAnswers;
  ambiguousAcknowledged?: boolean;
}

const BANDS: { id: Confidence; label: string; color: string; tint: string }[] = [
  { id: "clear", label: "Clear", color: "var(--verified-green-600)", tint: "var(--verified-green-50)" },
  { id: "leaning", label: "Leaning", color: "var(--ink-900)", tint: "rgba(14,27,44,0.10)" },
  { id: "ambiguous", label: "Ambiguous", color: "var(--amber-500)", tint: "var(--amber-50)" },
];

export function StatusAdvisorFlow({ initial }: { initial: Draft }) {
  const router = useRouter();
  const total = QUESTIONS.length;
  const startStep: Step = initial.step && /^q\d+$/.test(initial.step)
    ? (initial.step as Step)
    : initial.employeeId
      ? "q0"
      : "intro";
  const [step, setStep] = useState<Step>(startStep);
  const [name, setName] = useState(initial.name ?? "");
  const [nameInput, setNameInput] = useState(initial.name ?? "");
  const [answers, setAnswers] = useState<StatusAnswers>(initial.answers ?? {});
  const [ack, setAck] = useState(!!initial.ambiguousAcknowledged);
  const [result, setResult] = useState<{ id: string; reference: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [whyOpen, setWhyOpen] = useState(false);
  const [openFactor, setOpenFactor] = useState(0);

  const qIndex = /^q\d+$/.test(step) ? parseInt(step.slice(1), 10) : -1;
  useEffect(() => setWhyOpen(false), [step]);

  const det: Determination | null =
    qIndex === -1 && (step === "verdict" || step === "interstitial" || step === "determination")
      ? determineStatus(answers, name || "your new hire")
      : null;

  function persist(patch: Draft) {
    saveStatusDraft(patch).catch(() => {});
  }

  function submitName() {
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    startTransition(async () => {
      await startStatusAdvisor(n);
      setStep("q0");
    });
  }

  function answer(v: string) {
    const id = QUESTIONS[qIndex].id;
    const next = { ...answers, [id]: v };
    setAnswers(next);
    persist({ answers: { [id]: v }, step });
  }

  function nextQuestion() {
    if (qIndex < total - 1) {
      const s = `q${qIndex + 1}` as Step;
      setStep(s);
      persist({ step: s });
    } else {
      setStep("verdict");
    }
  }
  function prevStep() {
    if (qIndex > 0) setStep(`q${qIndex - 1}` as Step);
    else if (qIndex === 0) setStep("name");
    else if (step === "verdict") setStep(`q${total - 1}` as Step);
    else if (step === "interstitial") setStep("verdict");
  }

  function onVerdictPrimary() {
    if (!det) return;
    if (det.confidence === "ambiguous") {
      setStep("interstitial");
    } else {
      record();
    }
  }
  function continueFromInterstitial() {
    if (!det) return;
    startTransition(async () => {
      await acknowledgeAmbiguous(det.verdict, det.confidence);
      await doRecord();
    });
  }
  function record() {
    startTransition(async () => {
      await doRecord();
    });
  }
  async function doRecord() {
    const r = await recordDetermination();
    setResult(r);
    setStep("determination");
  }

  // ---------- INTRO ----------
  if (step === "intro") {
    return (
      <Flow footer={<Button variant="primary" style={{ width: "100%" }} onClick={() => setStep("name")}>Start the check</Button>}>
        <Eyebrow icon="balance">Status Advisor</Eyebrow>
        <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "0 0 14px" }}>
          Before anything else, let&apos;s check what kind of hire this is.
        </h1>
        <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 0 24px" }}>
          The law treats employees, workers and the self-employed differently. Getting this right decides which rights
          they have — and which duties fall to you. Everything after this step depends on the answer.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "schedule", head: "Takes about 5 minutes", body: "12 plain-English questions, one at a time. No legal jargon." },
            { icon: "cloud_done", head: "Saves as you go", body: "Stop whenever you like and pick up exactly where you left off." },
            { icon: "verified", head: "You get a determination", body: "A dated document you can keep, backed by the law it's based on." },
          ].map((r) => (
            <div key={r.icon} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                <Icon name={r.icon} size={21} />
              </div>
              <div>
                <div style={{ font: "600 16px/1.3 var(--font-body)" }}>{r.head}</div>
                <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--text-secondary)" }}>{r.body}</div>
              </div>
            </div>
          ))}
        </div>
      </Flow>
    );
  }

  // ---------- NAME ----------
  if (step === "name") {
    return (
      <Flow
        onBack={() => setStep("intro")}
        footer={<Button variant="primary" style={{ width: "100%" }} disabled={!nameInput.trim() || pending} loading={pending} onClick={submitName}>Continue</Button>}
      >
        <Eyebrow icon="person_add">Who is this about?</Eyebrow>
        <h1 style={{ font: "var(--text-h1)", fontSize: 30, letterSpacing: "var(--tracking-h)", margin: "0 0 8px" }}>
          Who are you thinking of taking on?
        </h1>
        <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 22px" }}>
          We&apos;ll use their name through the check and on the determination document.
        </p>
        <label className="fe-label">Their full name</label>
        <input
          className="fe-input"
          placeholder="e.g. Liam Carter"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
      </Flow>
    );
  }

  // ---------- QUESTION ----------
  if (qIndex >= 0) {
    const q = QUESTIONS[qIndex];
    const text = (str: string) => str.replaceAll("{name}", name || "them");
    return (
      <>
        <FlowBar onBack={prevStep} current={qIndex} total={total} />
        <Flow footer={<Button variant="primary" style={{ width: "100%" }} disabled={!answers[q.id]} onClick={nextQuestion}>Continue</Button>}>
          <div key={qIndex} style={{ animation: "fe-view-in 250ms var(--ease)" }}>
            <Eyebrow>{q.factor}</Eyebrow>
            <h1 style={{ font: "var(--text-h1)", fontSize: 30, letterSpacing: "var(--tracking-h)", margin: "0 0 22px" }}>{text(q.question)}</h1>
            <RadioCards options={q.options} value={answers[q.id]} onChange={answer} />
            <button
              onClick={() => setWhyOpen((o) => !o)}
              aria-expanded={whyOpen}
              style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, background: "none", border: "none", cursor: "pointer", font: "600 15px/1 var(--font-body)", color: "var(--ink-900)", padding: 0 }}
            >
              <Icon name="help" size={19} /> Why we ask this
              <Icon name="expand_more" size={20} style={{ transform: whyOpen ? "rotate(180deg)" : "none", transition: "transform 150ms var(--ease)" }} />
            </button>
            {whyOpen && (
              <div style={{ background: "rgba(14,27,44,0.05)", borderRadius: 12, padding: "14px 16px", marginTop: 12, font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)" }}>
                {text(q.why)}
              </div>
            )}
          </div>
        </Flow>
      </>
    );
  }

  // ---------- VERDICT ----------
  if (step === "verdict" && det) {
    const isAmb = det.confidence === "ambiguous";
    return (
      <>
        <FlowBar onBack={prevStep} />
        <Flow footer={<Button variant="primary" style={{ width: "100%" }} loading={pending} onClick={onVerdictPrimary}>{isAmb ? "See what to do next" : "Save my determination document"}</Button>}>
          <div style={{ background: isAmb ? "var(--amber-50)" : "var(--verified-green-50)", borderRadius: "var(--radius-card)", padding: "18px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: 12 }}>
              <Icon name="balance" size={16} /> Our determination
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: isAmb ? "var(--amber-500)" : "var(--verified-green-600)", display: "grid", placeItems: "center", flex: "none" }}>
                <Icon name={isAmb ? "help" : "check"} size={24} fill style={{ color: "#fff" }} />
              </div>
              <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>
                {isAmb ? `${name}'s status isn't clear-cut` : `${name} is ${articled(VERDICT_LABEL[det.verdict])}`}
              </h1>
            </div>
          </div>

          <ConfidenceGauge level={det.confidence} />

          <SectionLabel>In plain English</SectionLabel>
          <p style={{ font: "var(--text-body)", lineHeight: 1.55, margin: "0 0 24px" }}>{det.reasoning}</p>

          <SectionLabel>How we reached this</SectionLabel>
          <div>
            {det.factors.map((f, i) => (
              <FactorRow key={f.id} f={f} open={openFactor === i} onToggle={() => setOpenFactor(openFactor === i ? -1 : i)} last={i === det.factors.length - 1} />
            ))}
          </div>
        </Flow>
      </>
    );
  }

  // ---------- AMBIGUOUS INTERSTITIAL ----------
  if (step === "interstitial" && det) {
    return (
      <>
        <FlowBar onBack={() => setStep("verdict")} />
        <Flow footer={<Button variant="primary" style={{ width: "100%" }} disabled={!ack || pending} loading={pending} onClick={continueFromInterstitial}>Continue anyway</Button>}>
          <div style={{ width: 56, height: 56, borderRadius: 15, background: "var(--amber-50)", display: "grid", placeItems: "center", marginBottom: 18 }}>
            <Icon name="pan_tool" size={27} fill style={{ color: "var(--amber-700)" }} />
          </div>
          <h1 style={{ font: "var(--text-h1)", fontSize: 30, letterSpacing: "var(--tracking-h)", margin: "0 0 12px" }}>This one genuinely isn&apos;t clear-cut.</h1>
          <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 0 20px" }}>
            We&apos;d rather be honest than guess. {name}&apos;s answers don&apos;t land firmly in one box, and getting status
            wrong can mean back-taxes and penalties later. A short conversation with an adviser now is far cheaper than
            fixing it after.
          </p>
          <div style={{ background: "var(--amber-50)", border: "1px solid rgba(217,122,8,0.3)", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ font: "600 16px/1.3 var(--font-body)", marginBottom: 4 }}>We recommend professional advice before proceeding.</div>
            <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: 0 }}>
              An employment-status specialist can look at the detail of your arrangement and give you a firm answer.
            </p>
          </div>
          {[
            { icon: "support_agent", head: "Acas helpline", body: "Free, confidential advice · 0300 123 1100" },
            { icon: "gavel", head: "Find an employment solicitor", body: "Law Society — regulated specialists near you" },
          ].map((r) => (
            <div key={r.icon} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-hairline)" }}>
              <Icon name={r.icon} size={22} style={{ color: "var(--ink-900)" }} />
              <div>
                <div style={{ font: "600 15px/1.3 var(--font-body)" }}>{r.head}</div>
                <div className="fe-tabular" style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)" }}>{r.body}</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setAck((x) => !x)}
            role="checkbox"
            aria-checked={ack}
            style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 20, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
          >
            <span style={{ width: 24, height: 24, borderRadius: 6, border: ack ? "none" : "2px solid var(--neutral-200)", background: ack ? "var(--ink-900)" : "transparent", display: "grid", placeItems: "center", flex: "none", marginTop: 1 }}>
              {ack && <Icon name="check" size={16} style={{ color: "#fff" }} />}
            </span>
            <span style={{ font: "var(--text-body)", fontSize: 15, color: "var(--ink-900)" }}>
              I understand this determination is uncertain and I want to continue anyway.{" "}
              <span style={{ color: "var(--text-secondary)" }}>Your choice is recorded with the determination.</span>
            </span>
          </button>
        </Flow>
      </>
    );
  }

  // ---------- DETERMINATION ----------
  if (step === "determination" && det && result) {
    const isAmb = det.confidence === "ambiguous";
    const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    return (
      <Flow footer={<Button variant="primary" style={{ width: "100%" }} onClick={() => router.push("/app")}>Start your setup checklist <Icon name="arrow_forward" size={20} /></Button>}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--verified-green-50)", color: "var(--verified-green-700)", borderRadius: 999, padding: "7px 14px", font: "var(--text-label)", marginBottom: 18 }}>
          <Icon name="check_circle" size={17} fill /> Determination saved to your vault
        </div>
        <div className="fe-card fe-card--document" style={{ padding: 26 }}>
          <div style={{ font: "var(--text-caption)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: 8 }}>Employment status determination</div>
          <h2 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "0 0 2px" }}>{name}</h2>
          <div className="fe-tabular" style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>{result.reference}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid var(--border-hairline)", borderBottom: "1px solid var(--border-hairline)", padding: "12px 0", marginBottom: 16 }}>
            <Field label="Date" value={dateStr} />
            <Field label="Determination" value={isAmb ? "Uncertain — advice recommended" : VERDICT_LABEL[det.verdict]} />
          </div>
          <p style={{ font: "var(--text-body)", fontSize: 15, lineHeight: 1.5, margin: 0 }}>{det.reasoning}</p>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "rgba(14,27,44,0.05)", borderRadius: 10, padding: "12px 14px", marginTop: 16 }}>
            <Icon name="settings_suggest" size={19} style={{ flex: "none", marginTop: 1 }} />
            <span className="fe-tabular" style={{ font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-700)" }}>
              Generated by rules engine {det.rules_version} — a determination follows fixed legal rules, so it isn&apos;t examined.
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <a href={`/app/determinations/${result.id}/pdf`} className="fe-btn fe-btn--secondary" style={{ textDecoration: "none" }}>
            <Icon name="download" size={19} /> Download PDF
          </a>
          <a href="/app" className="fe-btn fe-btn--secondary" style={{ textDecoration: "none" }}>
            <Icon name="folder_open" size={19} /> View in vault
          </a>
        </div>
      </Flow>
    );
  }

  return null;
}

// ---------- shared bits ----------
function Flow({ children, footer, onBack }: { children: React.ReactNode; footer?: React.ReactNode; onBack?: () => void }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {onBack && (
        <div style={{ padding: "10px 8px" }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Icon name="arrow_back" size={24} />
          </button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 20px 28px", boxSizing: "border-box" }}>{children}</div>
      </div>
      {footer && (
        <div style={{ flex: "none", position: "sticky", bottom: 0, background: "rgba(247,244,238,0.94)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border-hairline)", padding: "14px 20px calc(14px + env(safe-area-inset-bottom))" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>{footer}</div>
        </div>
      )}
    </div>
  );
}

function FlowBar({ onBack, current, total }: { onBack: () => void; current?: number; total?: number }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 6, padding: "10px 14px 10px 6px", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
      <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer", flex: "none" }}>
        <Icon name="arrow_back" size={24} />
      </button>
      <span style={{ flex: 1 }} />
      {typeof current === "number" && typeof total === "number" && (
        <>
          <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", paddingRight: 6 }}>Q{current + 1} of {total}</span>
          <StepDots total={total} current={current} />
        </>
      )}
    </div>
  );
}

function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 12 }}>
      {icon && <Icon name={icon} size={17} />}
      {children}
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", margin: "26px 0 12px" }}>{children}</div>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ font: "var(--text-caption)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--neutral-500)", marginBottom: 3 }}>{label}</div>
      <div className="fe-tabular" style={{ font: "600 15px/1.3 var(--font-body)" }}>{value}</div>
    </div>
  );
}

function ConfidenceGauge({ level }: { level: Confidence }) {
  const activeIndex = BANDS.findIndex((b) => b.id === level);
  const active = BANDS[activeIndex];
  const markerLeft = ((activeIndex + 0.5) / BANDS.length) * 100;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>How certain we are</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "700 14px/1 var(--font-body)", color: active.id === "ambiguous" ? "var(--amber-700)" : active.id === "clear" ? "var(--verified-green-700)" : "var(--ink-900)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: active.color }} />
          {active.label}
        </span>
      </div>
      <div style={{ position: "relative", height: 22, marginBottom: 8 }}>
        <div style={{ position: "absolute", left: `${markerLeft}%`, top: 0, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ width: 18, height: 18, borderRadius: 999, background: active.color, border: "3px solid var(--surface-raised)", boxShadow: "0 1px 4px rgba(14,27,44,0.28)" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {BANDS.map((b, i) => (
          <div key={b.id} style={{ flex: 1, height: 10, borderRadius: 999, background: i === activeIndex ? b.color : b.tint }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {BANDS.map((b, i) => (
          <div key={b.id} style={{ flex: 1, textAlign: "center", font: `${i === activeIndex ? "600" : "500"} 12px/1.2 var(--font-body)`, color: i === activeIndex ? "var(--ink-900)" : "var(--neutral-400)" }}>{b.label}</div>
        ))}
      </div>
    </div>
  );
}

function FactorRow({ f, open, onToggle, last }: { f: Determination["factors"][number]; open: boolean; onToggle: () => void; last: boolean }) {
  return (
    <div style={{ borderBottom: last ? "none" : "1px solid var(--border-hairline)" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span>
          <span style={{ font: "600 16px/1.3 var(--font-body)", display: "block" }}>{f.factor}</span>
          <span style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)" }}>Your answer: {f.answerLabel}</span>
        </span>
        <Icon name="expand_more" size={22} style={{ color: "var(--neutral-400)", transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms var(--ease)", flex: "none" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: 16 }}>
          <p style={{ font: "var(--text-body)", fontSize: 15, lineHeight: 1.5, margin: "0 0 12px", color: "var(--neutral-700)" }}>{f.indicates}</p>
          <StatutoryReceipt reference={f.reference.reference} plainEnglish={f.reference.plainEnglish} guidanceUrl={f.reference.guidanceUrl} />
        </div>
      )}
    </div>
  );
}

function articled(label: string): string {
  const lower = label.toLowerCase();
  const article = /^[aeiou]/.test(lower) ? "an" : "a";
  return `${article} ${lower}`;
}
