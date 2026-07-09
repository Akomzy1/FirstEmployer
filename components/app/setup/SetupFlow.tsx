"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DateInput,
  DeadlineChip,
  FileUpload,
  Icon,
  RadioCards,
  StatutoryReceipt,
  StatusPill,
  TextInput,
  type Status,
} from "@/components/system";
import { PAYROLL_PROVIDERS, PAYROLL_REFERRAL_DISCLOSURE } from "@/lib/data/payroll-providers";
import { PENSION_PROVIDERS } from "@/lib/data/pension-providers";
import type { SetupStep, StepState } from "@/lib/rules/setup";
import {
  capturePayeReference,
  choosePayroll,
  completeStep,
  markStepInProgress,
  saveInsurance,
  setupPension,
} from "@/app/(app)/app/setup/actions";

export interface StatutoryCopy {
  elMinCover: number;
  elPenaltyDay: number;
  elCertPenalty: number;
  pensionEmployerPct: number;
  rtwPenalty: number;
  lelWeekly: number;
  declarationMonths: number;
  payRecordYears: number;
}
export interface SetupData {
  steps: (SetupStep & { state: StepState })[];
  setupState: { paye_ref?: string; payroll_provider?: string; pension_provider?: string; duties_start?: string };
  employeeName: string;
  employeeStartDate: string | null;
  declarationDeadline: string | null;
  statutory: StatutoryCopy;
}

const gbp = (n: number) => "£" + n.toLocaleString("en-GB");
const gbpM = (n: number) => "£" + n / 1_000_000 + " million";
const asStatus = (s: StepState): Status => (s === "blocked" ? "blocked" : (s as Status));
function blockedReason(depStep: string): string {
  if (depStep === "hmrc_paye") return "Unlocks when you start registering with HMRC";
  if (depStep === "pension") return "Unlocks when you complete pension setup";
  return "Unlocks when an earlier step is done";
}
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function SetupFlow(props: SetupData) {
  const router = useRouter();
  const [view, setView] = useState<string>("checklist");
  const back = () => { setView("checklist"); router.refresh(); };

  const step = (id: string) => props.steps.find((s) => s.id === id)!;

  if (view === "hmrc") return <HmrcView {...props} step={step("hmrc_paye")} onBack={back} />;
  if (view === "payroll") return <PayrollView {...props} step={step("payroll")} onBack={back} />;
  if (view === "pension") return <PensionView {...props} step={step("pension")} onBack={back} />;
  if (view === "insurance") return <InsuranceView {...props} step={step("el_insurance")} onBack={back} />;
  if (view === "ico" || view === "hs" || view === "records") return <GuidanceView view={view} {...props} onBack={back} />;

  return <Checklist {...props} onOpen={setView} />;
}

// ---------------- Checklist ----------------
function Checklist({ steps, onOpen }: SetupData & { onOpen: (v: string) => void }) {
  const owned = steps.filter((s) => s.owner === "setup");
  const done = owned.filter((s) => s.state === "complete").length;
  const pct = Math.round((done / owned.length) * 100);
  const navFor = (s: SetupStep & { state: StepState }): string | null => {
    if (s.state === "blocked") return null;
    if (s.owner === "setup") return { hmrc_paye: "hmrc", payroll: "payroll", pension: "pension", el_insurance: "insurance", ico_registration: "ico", health_safety: "hs" }[s.id] ?? null;
    if (s.owner === "records") return "records";
    if (s.owner === "contract") return "/app/documents";
    if (s.owner === "right_to_work") return "/app";
    return null;
  };
  const router = useRouter();

  return (
    <Frame>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 40px" }}>
          <Eyebrow icon="checklist">Employer setup</Eyebrow>
          <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 6px" }}>Your setup checklist</h1>
          <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 18px" }}>
            {done} of {owned.length} done. Work through these in order — we&apos;ll keep the deadlines for you.
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", font: "var(--text-caption)", marginBottom: 8 }}>
            <span style={{ color: "var(--text-secondary)" }}>Getting to green</span>
            <span className="fe-tabular" style={{ fontWeight: 600 }}>{pct}%</span>
          </div>
          <div className="fe-progress-track" style={{ marginBottom: 26 }}>
            <div className={"fe-progress-fill" + (pct >= 100 ? " fe-progress-fill--complete" : "")} style={{ width: `${pct}%` }} />
          </div>

          <div>
            {steps.map((s) => {
              const nav = navFor(s);
              const tappable = !!nav;
              const onClick = () => { if (!nav) return; if (nav.startsWith("/")) router.push(nav); else onOpen(nav); };
              return (
                <button key={s.id} onClick={tappable ? onClick : undefined} disabled={!tappable}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 4px", borderBottom: "1px solid var(--border-hairline)", background: "none", border: "none", borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, cursor: tappable ? "pointer" : "default", textAlign: "left", opacity: s.state === "blocked" ? 0.72 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ font: "600 17px/1.3 var(--font-body)" }}>{s.name}</span>
                      <StatusPill status={asStatus(s.state)} />
                    </div>
                    {s.state === "blocked" && s.dependsOn && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, font: "var(--text-caption)", fontSize: 14, color: "var(--amber-700)" }}>
                        <Icon name="lock" size={15} /> {blockedReason(s.dependsOn.step)}
                      </div>
                    )}
                    {s.state !== "blocked" && (
                      <div style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)" }}>{s.guidance}</div>
                    )}
                  </div>
                  <Icon name={s.state === "blocked" ? "lock" : "chevron_right"} size={s.state === "blocked" ? 18 : 22} style={{ color: "var(--neutral-400)", flex: "none" }} />
                </button>
              );
            })}
          </div>
          <p style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 20 }}>
            Every step is saved as you go. Come back any time — nothing is lost.
          </p>
        </div>
      </div>
    </Frame>
  );
}

// ---------------- HMRC ----------------
function HmrcView({ step, setupState, statutory, onBack }: SetupData & { step: SetupStep & { state: StepState }; onBack: () => void }) {
  const [status, setStatus] = useState<"in-progress" | "complete">(step.state === "complete" ? "complete" : "in-progress");
  const [payeRef, setPayeRef] = useState(setupState.paye_ref ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      if (status === "complete") {
        const r = await capturePayeReference(payeRef);
        if (!r.ok) { setError(r.error ?? "Invalid reference"); return; }
      } else {
        await markStepInProgress("hmrc_paye");
      }
      onBack();
    });
  }

  return (
    <StepScreen onBack={onBack} status={step.state} footer={
      <Button variant="primary" style={{ width: "100%" }} loading={pending} onClick={save}>
        {status === "complete" ? "Save and mark complete" : "Save and remind me"}
      </Button>
    }>
      <StepHeader label="Step 1 of 6" title="Register as an employer with HMRC"
        lede="You do this once, on GOV.UK. It takes about 10 minutes, then HMRC posts your PAYE reference. We'll walk you through every screen." />
      <p style={{ font: "var(--text-body)", margin: "0 0 20px" }}>
        {step.guidance}{" "}
        <StatutoryReceipt reference="PAYE Regs 2003 reg 2"
          plainEnglish={`Because you pay them more than ${gbp(statutory.lelWeekly)} a week, you must run PAYE and tell HMRC. Registering as an employer is the first step.`}
          guidanceUrl="https://www.gov.uk/register-employer" />
      </p>

      {/* Government Gateway trap — the single highest-value guidance (never trim) */}
      <Alert kind="warning" title="Create an ORGANISATION account, not an individual one">
        This is the single most common mistake — and if you pick the wrong one it takes weeks to fix. When Government
        Gateway asks what type of account you want, choose <strong>Organisation</strong>.
      </Alert>

      <div style={{ background: "var(--ink-900)", color: "var(--bone-50)", borderRadius: "var(--radius-card)", padding: "20px 20px 22px", margin: "22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", opacity: 0.7, marginBottom: 10 }}>
          <Icon name="hourglass_top" size={16} /> While you wait
        </div>
        <h3 style={{ font: "var(--text-h3)", color: "var(--bone-50)", margin: "0 0 8px" }}>HMRC posts your PAYE reference within 5 working days</h3>
        <p style={{ font: "var(--text-body)", fontSize: 15, opacity: 0.9, margin: 0 }}>
          Mark this step <strong>In progress</strong> and we&apos;ll remind you to come back and add it. When it arrives, mark the step complete.
        </p>
      </div>

      <RadioCards
        label="Where are you up to?"
        value={status}
        onChange={(v) => setStatus(v as "in-progress" | "complete")}
        options={[
          { value: "in-progress", title: "In progress", description: "I've registered — waiting for the PAYE reference to arrive." },
          { value: "complete", title: "Complete", description: "My PAYE reference has arrived and I'll add it now." },
        ]}
      />

      {status === "complete" && (
        <div style={{ marginTop: 20 }}>
          <TextInput label="PAYE reference" placeholder="e.g. 475/LW93401"
            hint="On the letter from HMRC — three digits, a slash, then letters and numbers."
            value={payeRef} onChange={(e) => { setPayeRef(e.target.value); setError(null); }} error={error ?? undefined} />
        </div>
      )}
      <div style={{ marginTop: 20 }}>
        <FileUpload label="Evidence (optional)" hint="Photograph your HMRC letter" fileTypes="PDF, JPG or PNG" />
      </div>
    </StepScreen>
  );
}

// ---------------- Payroll ----------------
function PayrollView({ step, setupState, onBack }: SetupData & { step: SetupStep & { state: StepState }; onBack: () => void }) {
  const [chosen, setChosen] = useState(setupState.payroll_provider ?? "brightpay");
  const [pending, start] = useTransition();
  return (
    <StepScreen onBack={onBack} status={step.state} footer={
      <Button variant="primary" style={{ width: "100%" }} loading={pending} onClick={() => start(async () => { await choosePayroll(chosen); onBack(); })}>
        Save and continue
      </Button>
    }>
      <StepHeader label="Step 2 of 6" title="Choose payroll software"
        lede="Payroll software works out your employee's tax and tells HMRC every payday. You need software HMRC recognises — all three below qualify." />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "rgba(14,27,44,0.05)", borderRadius: 12, padding: "13px 15px", marginBottom: 20 }}>
        <Icon name="handshake" size={20} style={{ flex: "none", marginTop: 1 }} />
        <div>
          <div style={{ font: "600 15px/1.3 var(--font-body)", marginBottom: 3 }}>{PAYROLL_REFERRAL_DISCLOSURE.title}</div>
          <div style={{ font: "var(--text-body)", fontSize: 14, color: "var(--neutral-700)" }}>{PAYROLL_REFERRAL_DISCLOSURE.body}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {PAYROLL_PROVIDERS.map((p) => {
          const sel = chosen === p.id;
          return (
            <button key={p.id} onClick={() => setChosen(p.id)} style={{ textAlign: "left", cursor: "pointer", background: "var(--surface-raised)", border: sel ? "2px solid var(--ink-900)" : p.recommended ? "2px solid var(--verified-green-600)" : "1.5px solid var(--neutral-200)", borderRadius: "var(--radius-card)", boxShadow: p.recommended ? "var(--shadow-popover)" : "var(--shadow-card)", padding: "20px 20px 22px", position: "relative" }}>
              {p.recommended && <span style={{ position: "absolute", top: -12, left: 20, font: "600 11px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", background: "var(--ink-900)", padding: "6px 12px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="star" size={13} fill style={{ color: "var(--verified-green-600)" }} />Our pick</span>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)" }}>{p.name}</span>
                <span className="fe-tabular" style={{ font: "600 16px/1 var(--font-body)" }}>{p.price}</span>
              </div>
              <div className="fe-tabular" style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginBottom: 10 }}>{p.priceNote}</div>
              {p.hmrcRecognised && <span className="fe-pill fe-status--complete" style={{ marginBottom: 12 }}><Icon name="verified" size={15} /> Recognised by HMRC</span>}
              <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: "10px 0 12px" }}>{p.bestFor}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                {p.points.map((pt, i) => (
                  <li key={i} style={{ display: "flex", gap: 8, font: "var(--text-body)", fontSize: 15 }}>
                    <Icon name="check" size={16} style={{ color: "var(--verified-green-600)", flex: "none", marginTop: 2 }} />{pt}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 14, font: "600 15px/1 var(--font-body)", color: sel ? "var(--verified-green-700)" : "var(--ink-900)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                {sel ? <><Icon name="check" size={18} /> Chosen</> : `Choose ${p.name.split(" ")[0]}`}
              </div>
            </button>
          );
        })}
      </div>
    </StepScreen>
  );
}

// ---------------- Pension ----------------
function PensionView({ step, setupState, employeeName, employeeStartDate, statutory, onBack }: SetupData & { step: SetupStep & { state: StepState }; onBack: () => void }) {
  const [start_, setStart] = useState(setupState.duties_start ?? employeeStartDate ?? "");
  const [provider, setProvider] = useState(setupState.pension_provider ?? "nest");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  function confirm() {
    startT(async () => {
      const r = await setupPension(provider, start_);
      setDeadline(r.deadline);
    });
  }

  return (
    <StepScreen onBack={onBack} status={step.state} footer={
      deadline ? <Button variant="primary" style={{ width: "100%" }} onClick={onBack}>Back to your setup</Button>
        : <Button variant="primary" style={{ width: "100%" }} loading={pending} disabled={!start_} onClick={confirm}>Set up the pension</Button>
    }>
      <StepHeader label="Step 3 of 6" title="Set up workplace pension"
        lede="Because your hire is an employee, you must offer a workplace pension and pay in. Here's your timeline, worked out from their start date." />
      <p style={{ font: "var(--text-body)", margin: "0 0 20px" }}>
        {step.guidance}{" "}
        <StatutoryReceipt reference="Pensions Act 2008 s.3"
          plainEnglish={`You must put eligible staff into a workplace pension and pay in at least ${statutory.pensionEmployerPct}% of their qualifying wages. This is called automatic enrolment.`}
          guidanceUrl="https://www.gov.uk/workplace-pensions-employers" />
      </p>

      <DateInput label="Duties start date" hint="Your employee's first day. Auto-enrolment duties begin immediately." value={start_} onChange={(e) => setStart(e.target.value)} />

      {deadline ? (
        <div style={{ marginTop: 22 }}>
          <Alert kind="success" title="Pension set up">
            We&apos;ve added the declaration of compliance deadline — <strong>{fmtDate(deadline)}</strong> — to your compliance dashboard. You&apos;ll get a reminder before it&apos;s due.
          </Alert>
          <div style={{ marginTop: 14 }}>
            <DeadlineChip dueDate={deadline}>Declaration due {fmtDate(deadline)}</DeadlineChip>
          </div>
        </div>
      ) : start_ ? (
        <div style={{ marginTop: 22, padding: "16px 18px", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)" }}>
          <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: 8 }}>Your declaration deadline</div>
          <p style={{ font: "var(--text-body)", fontSize: 15, margin: 0 }}>
            You must complete your declaration of compliance within {statutory.declarationMonths} months of the duties start date.{" "}
            <StatutoryReceipt reference="Pensions Act 2008 s.11"
              plainEnglish="You must tell The Pensions Regulator how you've met your automatic-enrolment duties. This is the declaration of compliance."
              guidanceUrl="https://www.thepensionsregulator.gov.uk/en/employers/declaration-of-compliance" />
          </p>
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 12 }}>Choose a provider</div>
        <RadioCards value={provider} onChange={setProvider}
          options={PENSION_PROVIDERS.map((p) => ({ value: p.id, title: p.name + (p.popular ? " · Popular first choice" : ""), description: `${p.note} — ${p.fee}` }))} />
      </div>
    </StepScreen>
  );
}

// ---------------- Insurance ----------------
function InsuranceView({ step, statutory, onBack }: SetupData & { step: SetupStep & { state: StepState }; onBack: () => void }) {
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<{ dataUrl: string; type: string } | null>(null);
  const [pending, start] = useTransition();

  function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => setFile({ dataUrl: reader.result as string, type: f.type });
    reader.readAsDataURL(f);
  }
  function save() {
    if (!file || !expiry) return;
    start(async () => { await saveInsurance(expiry, file.dataUrl, file.type); onBack(); });
  }

  return (
    <StepScreen onBack={onBack} status={step.state} footer={
      <Button variant="primary" style={{ width: "100%" }} loading={pending} disabled={!file || !expiry} onClick={save}>Save certificate</Button>
    }>
      <StepHeader label="Step 4 of 6" title="Employer's liability insurance"
        lede={`From your employee's first day you must hold at least ${gbpM(statutory.elMinCover)} of employers' liability cover. It protects you if they're ever hurt or made ill by the work.`} />
      <StatutoryReceipt reference="ELCI Act 1969 s.1"
        plainEnglish={`You must hold at least ${gbpM(statutory.elMinCover)} of employers' liability cover from the day they start. You have to show the certificate if asked.`}
        guidanceUrl="https://www.gov.uk/employers-liability-insurance" />

      <div style={{ background: "var(--red-50)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: "var(--radius-card)", padding: "16px 18px", margin: "20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Icon name="error" size={20} style={{ color: "var(--red-600)" }} />
          <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--red-700)" }}>Up to {gbp(statutory.elPenaltyDay)} for every day you&apos;re not covered</span>
        </div>
        <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: "0 0 8px" }}>
          That&apos;s the fine if you employ someone without this insurance. It&apos;s one of the cheapest problems to avoid.
        </p>
        <StatutoryReceipt reference="ELCI Act 1969 s.5"
          plainEnglish={`You can be fined up to ${gbp(statutory.elPenaltyDay)} for each day you don't have proper cover, and ${gbp(statutory.elCertPenalty)} if you don't display or show the certificate when asked.`} />
      </div>

      <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", margin: "8px 0 12px" }}>Add your certificate</div>
      <FileUpload label="Your insurance certificate" hint="Take a photo of the certificate" fileTypes="PDF, JPG or PNG" onFile={onFile} />
      {file && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, font: "var(--text-caption)", color: "var(--verified-green-700)" }}><Icon name="check" size={15} /> Certificate ready</div>}
      <div style={{ marginTop: 18 }}>
        <DateInput label="Expiry date" hint="On the certificate — we'll remind you a month before it runs out." value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      </div>
    </StepScreen>
  );
}

// ---------------- Guidance (ICO / H&S / records) ----------------
function GuidanceView({ view, steps, statutory, onBack }: SetupData & { view: string; onBack: () => void }) {
  const map: Record<string, { id: string; title: string; label: string; lede: string; cta: string }> = {
    ico: { id: "ico_registration", title: "Register with the ICO", label: "Step 5 of 6", lede: "You process staff personal data, so you likely need to register with the ICO and pay the annual data-protection fee.", cta: "Mark as done" },
    hs: { id: "health_safety", title: "Basic health & safety", label: "Step 6 of 6", lede: "Do a simple risk assessment and display the health-and-safety law poster, or give staff the leaflet.", cta: "Mark as done" },
    records: { id: "record_keeping", title: "Keep the right records", label: "Records", lede: `The law asks you to keep pay and tax records for ${statutory.payRecordYears} years. Your payroll software and FirstEmployer do most of this for you.`, cta: "Review your records" },
  };
  const g = map[view];
  const step = steps.find((s) => s.id === g.id)!;
  const [pending, start] = useTransition();
  return (
    <StepScreen onBack={onBack} status={step.state} footer={
      <Button variant="primary" style={{ width: "100%" }} loading={pending} onClick={() => start(async () => { await completeStep(g.id); onBack(); })}>{g.cta}</Button>
    }>
      <StepHeader label={g.label} title={g.title} lede={g.lede} />
    </StepScreen>
  );
}

// ---------------- scaffold ----------------
function Frame({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>{children}</div>;
}
function StepScreen({ children, footer, onBack, status }: { children: React.ReactNode; footer: React.ReactNode; onBack: () => void; status: StepState }) {
  return (
    <Frame>
      <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 6, padding: "10px 14px 10px 6px", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="arrow_back" size={24} /></button>
        <span style={{ flex: 1 }} />
        <StatusPill status={asStatus(status)} />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 20px 28px" }}>{children}</div>
      </div>
      <div style={{ flex: "none", position: "sticky", bottom: 0, background: "rgba(247,244,238,0.94)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--border-hairline)", padding: "14px 20px calc(14px + env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>{footer}</div>
      </div>
    </Frame>
  );
}
function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 12 }}>{icon && <Icon name={icon} size={17} />}{children}</div>;
}
function StepHeader({ label, title, lede }: { label: string; title: string; lede: string }) {
  return (
    <header style={{ marginBottom: 22 }}>
      <Eyebrow>{label}</Eyebrow>
      <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px" }}>{title}</h1>
      <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: 0 }}>{lede}</p>
    </header>
  );
}
