"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DateInput,
  DocumentCard,
  Icon,
  RadioCards,
  Select,
  StatutoryReceipt,
  VerificationSeal,
} from "@/components/system";
import { saveContractDraft, generateContractAction, type ContractForm } from "@/app/(app)/app/documents/actions";
import { FeedbackWidget } from "@/components/app/FeedbackWidget";
import { markModuleCompleted } from "@/components/pwa/InstallPrompt";
import type { DocumentListItemView, GenerationResultView, ExamCheckView } from "@/lib/documents/view";

/** A statutory receipt's copy, assembled server-side from config (no literals here). */
export interface ReceiptCopy {
  reference: string;
  plainEnglish: string;
  guidanceUrl: string;
}

export interface DocumentsFlowProps {
  employeeName: string;
  documents: DocumentListItemView[];
  draft: Partial<ContractForm>;
  defaults: ContractForm;
  /** Config-derived floors + receipt copy for live validation (Rule 4). */
  floors: {
    payFloor: number;
    payBandLabel: string;
    holidayFloor: number;
    receipts: {
      nmw: ReceiptCopy;
      wtr: ReceiptCopy;
      notice: ReceiptCopy;
      place: ReceiptCopy;
      pension: ReceiptCopy;
    };
  };
}

type View = "empty" | "list" | "questionnaire" | "generation";

const CHECK_META: { id: number; label: string; ref: string }[] = [
  { id: 1, label: "Employer and employee named", ref: "ERA 1996 s.1(3)(a)" },
  { id: 2, label: "Employment start date stated", ref: "ERA 1996 s.1(3)(b)" },
  { id: 3, label: "Pay meets the minimum wage", ref: "NMWA 1998 s.1" },
  { id: 4, label: "Pay amount and interval set out", ref: "ERA 1996 s.1(4)(a)" },
  { id: 5, label: "Working hours defined", ref: "ERA 1996 s.1(4)(c)" },
  { id: 6, label: "Holiday is at least the legal minimum", ref: "WTR 1998 reg 13" },
  { id: 7, label: "Place of work stated", ref: "ERA 1996 s.1(4)(h)" },
  { id: 8, label: "Job title or duties described", ref: "ERA 1996 s.1(4)(f)" },
  { id: 9, label: "Probation terms set out", ref: "ERA 1996 s.1(4)(ba)" },
  { id: 10, label: "Notice periods meet the legal floor", ref: "ERA 1996 s.86" },
  { id: 11, label: "Sick pay and SSP explained", ref: "ERA 1996 s.1(4)(d)(ii)" },
  { id: 12, label: "Pension arrangements included", ref: "PA 2008 s.3" },
  { id: 13, label: "Discipline and grievance covered", ref: "ERA 1996 s.3(1)" },
];

/* A contract page passing through a 13-point statutory gate (empty-state illustration). */
function ExaminerGate({ width = 300 }: { width?: number }) {
  const dots = Array.from({ length: 13 });
  return (
    <svg viewBox="0 0 320 200" width={width} style={{ maxWidth: "100%", display: "block" }} role="img" aria-label="A contract passing through a thirteen-point statutory gate">
      <rect x="150" y="18" width="6" height="164" rx="3" fill="var(--ink-900)" />
      <rect x="164" y="18" width="6" height="164" rx="3" fill="var(--ink-900)" />
      {dots.map((_, i) => (
        <circle key={i} cx="160" cy={26 + i * 12.4} r="2.4" fill="var(--verified-green-600)" />
      ))}
      <g transform="translate(28,58)">
        <rect x="0" y="0" width="78" height="98" rx="6" fill="#FDFBF5" stroke="rgba(14,27,44,0.16)" strokeWidth="1.5" />
        <rect x="12" y="16" width="42" height="5" rx="2.5" fill="var(--neutral-200)" />
        <rect x="12" y="30" width="54" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="40" width="54" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="50" width="40" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="66" width="54" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="76" width="48" height="4" rx="2" fill="var(--neutral-100)" />
      </g>
      <g transform="translate(214,58)">
        <rect x="0" y="0" width="78" height="98" rx="6" fill="#FDFBF5" stroke="rgba(30,158,106,0.5)" strokeWidth="1.5" />
        <rect x="12" y="16" width="42" height="5" rx="2.5" fill="var(--neutral-200)" />
        <rect x="12" y="30" width="54" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="40" width="54" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="50" width="40" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="66" width="54" height="4" rx="2" fill="var(--neutral-100)" />
        <rect x="12" y="76" width="48" height="4" rx="2" fill="var(--neutral-100)" />
        <circle cx="66" cy="12" r="15" fill="var(--surface-raised)" stroke="var(--verified-green-600)" strokeWidth="2" />
        <path d="M59 12.5 63.5 17 73 7" stroke="var(--verified-green-700)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

const scroll: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };
const wrap: React.CSSProperties = { maxWidth: 640, margin: "0 auto", width: "100%", boxSizing: "border-box" };

export function DocumentsFlow({ employeeName, documents, draft, defaults, floors }: DocumentsFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<View>(documents.length ? "list" : "empty");
  const [result, setResult] = useState<GenerationResultView | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const goList = () => setView(documents.length ? "list" : "empty");
  const openApproved = () => {
    if (result?.status === "approved") router.push(`/app/documents/${result.documentId}`);
    else goList();
  };

  function startGeneration(form: ContractForm) {
    setRunError(null);
    setResult(null);
    setView("generation");
    generateContractAction(form)
      .then(setResult)
      .catch((e: Error) => setRunError(e.message || "Something went wrong. Your answers are saved."));
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      {view === "empty" && <EmptyView employeeName={employeeName} onCreate={() => setView("questionnaire")} />}
      {view === "list" && (
        <ListView
          employeeName={employeeName}
          documents={documents}
          onCreate={() => setView("questionnaire")}
          onOpen={(id) => router.push(`/app/documents/${id}`)}
        />
      )}
      {view === "questionnaire" && (
        <QuestionnaireView
          employeeName={employeeName}
          draft={draft}
          defaults={defaults}
          floors={floors}
          onBack={goList}
          onGenerate={startGeneration}
        />
      )}
      {view === "generation" && (
        <GenerationView
          employeeName={employeeName}
          result={result}
          error={runError}
          onApproved={openApproved}
          onBack={goList}
        />
      )}
    </div>
  );
}

/* ---------------- Empty ---------------- */
function EmptyView({ employeeName, onCreate }: { employeeName: string; onCreate: () => void }) {
  return (
    <div style={scroll}>
      <div style={{ padding: "0 20px 40px", animation: "fe-view-in 220ms var(--ease)" }}>
        <div style={wrap}>
          <header style={{ margin: "26px 0 22px" }}>
            <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Documents</h1>
            <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>
              The legal papers for {employeeName} live here. You have none yet.
            </p>
          </header>
          <div
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-card)",
              padding: "30px 22px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "grid", placeItems: "center", marginBottom: 22 }}>
              <ExaminerGate />
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "var(--verified-green-50)",
                color: "var(--verified-green-700)",
                borderRadius: 999,
                padding: "6px 14px",
                font: "600 13px/1 var(--font-body)",
                marginBottom: 16,
              }}
            >
              <Icon name="balance" size={16} />
              Checked by the Examiner
            </div>
            <h2 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px", textWrap: "balance" }}>
              Every document is checked against 13 statutory requirements before you ever see it.
            </h2>
            <p style={{ font: "var(--text-body)", color: "var(--neutral-700)", margin: "0 auto 24px", maxWidth: 420 }}>
              If it doesn&apos;t pass, it doesn&apos;t reach you.
            </p>
            <Button variant="primary" style={{ width: "100%" }} onClick={onCreate}>
              Create {employeeName}&apos;s employment contract
            </Button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "18px 2px 0",
              font: "var(--text-caption)",
              fontSize: 14,
              color: "var(--neutral-500)",
            }}
          >
            <Icon name="lock" size={16} style={{ marginTop: 1, flex: "none" }} />
            Your answers are saved as you go and stored in the UK, encrypted.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- List ---------------- */
function ListView({
  employeeName,
  documents,
  onCreate,
  onOpen,
}: {
  employeeName: string;
  documents: DocumentListItemView[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div style={scroll}>
      <div style={{ padding: "0 20px 30px", animation: "fe-view-in 220ms var(--ease)" }}>
        <div style={wrap}>
          <header style={{ margin: "26px 0 22px" }}>
            <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Documents</h1>
            <p className="fe-tabular" style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>
              {documents.length} document{documents.length === 1 ? "" : "s"} for {employeeName}, each checked against 13 statutory requirements.
            </p>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 30, marginBottom: 26 }}>
            {documents.map((d) => (
              <div
                key={d.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(d.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(d.id)}
                style={{ cursor: "pointer" }}
              >
              <DocumentCard
                title={d.typeLabel}
                verified={d.verified}
                sealProps={d.seal}
                meta={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="person" size={16} />
                    {d.employeeName}
                    <span style={{ color: "var(--neutral-200)" }}>·</span>
                    {d.dateLabel}
                  </span>
                }
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "600 14px/1 var(--font-body)", color: "var(--verified-green-700)" }}>
                  <Icon name="verified" size={16} />
                  {d.verified ? "Examiner verified" : d.status}
                </span>
              </DocumentCard>
              </div>
            ))}
          </div>
          <Button variant="secondary" style={{ width: "100%" }} onClick={onCreate}>
            <Icon name="add" size={20} />
            Create another document
          </Button>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "22px 2px 0",
              font: "var(--text-caption)",
              fontSize: 14,
              color: "var(--neutral-500)",
            }}
          >
            <Icon name="lock" size={16} style={{ marginTop: 1, flex: "none" }} />
            Stored in the UK, encrypted. Download or share any document any time.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Questionnaire ---------------- */
const textareaStyle: React.CSSProperties = {
  font: "var(--text-body)",
  color: "var(--ink-900)",
  background: "var(--surface-raised)",
  border: "1.5px solid var(--neutral-200)",
  borderRadius: "var(--radius-input)",
  minHeight: 96,
  padding: "12px 16px",
  width: "100%",
  boxSizing: "border-box",
  resize: "vertical",
  lineHeight: 1.5,
};

function FormSection({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        padding: "22px 20px",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: "var(--ink-900)",
            color: "var(--bone-50)",
            display: "grid",
            placeItems: "center",
            font: "600 14px/1 var(--font-body)",
            flex: "none",
          }}
        >
          {n}
        </span>
        <h2 style={{ font: "600 19px/1.2 var(--font-display)", letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
    </section>
  );
}

function ValidLine({ children, receipt }: { children: React.ReactNode; receipt?: React.ReactNode }) {
  return (
    <div
      className="fe-tabular"
      style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, font: "600 15px/1.4 var(--font-body)", color: "var(--verified-green-700)" }}
    >
      <Icon name="check" size={16} style={{ marginTop: 2, flex: "none" }} />
      <span>
        {children}
        {receipt && <span style={{ marginLeft: 8, display: "inline-block" }}>{receipt}</span>}
      </span>
    </div>
  );
}

function FloorHint({ children, receipt }: { children: React.ReactNode; receipt?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, font: "var(--text-caption)", fontSize: 15, color: "var(--text-secondary)" }}>
      <span>
        {children}
        {receipt && <span style={{ marginLeft: 8, display: "inline-block" }}>{receipt}</span>}
      </span>
    </div>
  );
}

function QuestionnaireView({
  employeeName,
  draft,
  defaults,
  floors,
  onBack,
  onGenerate,
}: {
  employeeName: string;
  draft: Partial<ContractForm>;
  defaults: ContractForm;
  floors: DocumentsFlowProps["floors"];
  onBack: () => void;
  onGenerate: (form: ContractForm) => void;
}) {
  const [f, setF] = useState<ContractForm>({ ...defaults, ...draft });
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: keyof ContractForm) => (val: string) => {
    setF((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveContractDraft({ [key]: val } as Partial<ContractForm>)
        .then(() => setSaved(true))
        .catch(() => setSaved(true));
    }, 800);
  };
  const onInput = (key: keyof ContractForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(key)(e.target.value);

  const rateNum = parseFloat(f.rate);
  const rateOk = !isNaN(rateNum) && Math.round(rateNum * 100) >= Math.round(floors.payFloor * 100);
  const rateBelow = !isNaN(rateNum) && Math.round(rateNum * 100) < Math.round(floors.payFloor * 100);
  const holidayNum = parseInt(f.holiday, 10);
  const holidayOk = !isNaN(holidayNum) && holidayNum >= floors.holidayFloor;
  const holidayBelow = !isNaN(holidayNum) && holidayNum < floors.holidayFloor;

  const R = floors.receipts;
  const receipt = (c: ReceiptCopy) => (
    <StatutoryReceipt reference={c.reference} plainEnglish={c.plainEnglish} guidanceUrl={c.guidanceUrl} />
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <TopBar onBack={onBack} eyebrow="New employment contract" right={<SaveIndicator saved={saved} />} />
      <div style={scroll}>
        <div style={{ padding: "0 18px 36px" }}>
          <div style={wrap}>
            <header style={{ margin: "18px 0 20px" }}>
              <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>
                Tell us about {employeeName}&apos;s role
              </h1>
              <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "8px 0 0" }}>
                We check every answer against the law as you go. Nothing to file — it saves itself.
              </p>
            </header>

            <FormSection n="1" title="Role & duties">
              <div>
                <label className="fe-label">Job title</label>
                <input className="fe-input" value={f.jobTitle} onChange={onInput("jobTitle")} placeholder="e.g. Apprentice plumber" />
              </div>
              <div>
                <label className="fe-label">Main duties</label>
                <textarea style={textareaStyle} value={f.duties} onChange={onInput("duties")} />
                <div className="fe-hint">Plain words are fine — what will {employeeName} actually do day to day?</div>
              </div>
              <div>
                <label className="fe-label">Place of work</label>
                <textarea style={textareaStyle} value={f.place} onChange={onInput("place")} />
                <FloorHint receipt={receipt(R.place)}>The contract must name where {employeeName} works.</FloorHint>
              </div>
            </FormSection>

            <FormSection n="2" title="Pay & hours">
              <div>
                <label className="fe-label">Hourly rate</label>
                <span className="fe-input-wrap">
                  <span className="fe-input-affix" aria-hidden="true">£</span>
                  <input
                    inputMode="decimal"
                    className={"fe-input fe-input--prefixed fe-tabular" + (rateBelow ? " fe-input--error" : "")}
                    value={f.rate}
                    onChange={onInput("rate")}
                  />
                </span>
                {rateOk && (
                  <ValidLine receipt={receipt(R.nmw)}>
                    £{rateNum.toFixed(2)} meets the {floors.payBandLabel} minimum wage.
                  </ValidLine>
                )}
                {rateBelow && (
                  <div className="fe-error-msg" role="alert">
                    <Icon name="error" size={18} style={{ marginTop: 1 }} />
                    <span>
                      Below the {floors.payBandLabel} minimum wage of £{floors.payFloor.toFixed(2)} an hour. {employeeName} must be paid at least this.
                      <span style={{ marginLeft: 8, display: "inline-block" }}>{receipt(R.nmw)}</span>
                    </span>
                  </div>
                )}
                {isNaN(rateNum) && (
                  <FloorHint receipt={receipt(R.nmw)}>
                    The {floors.payBandLabel} minimum wage is £{floors.payFloor.toFixed(2)} an hour.
                  </FloorHint>
                )}
              </div>
              <div>
                <label className="fe-label">Hours a week</label>
                <input inputMode="numeric" className="fe-input fe-tabular" value={f.hours} onChange={onInput("hours")} />
                <div className="fe-hint">Full-time is usually 35–40 hours a week.</div>
              </div>
              <Select label="How often is pay made?" value={f.interval} onChange={onInput("interval")} options={["Weekly", "Fortnightly", "Monthly"]} />
            </FormSection>

            <FormSection n="3" title="Dates & probation">
              <DateInput label={employeeName + "'s start date"} value={f.start} onChange={onInput("start")} hint={"The first day " + employeeName + " works for you."} />
              <Select label="Probation length" value={f.probation} onChange={onInput("probation")} options={["None", "1 month", "3 months", "6 months"]} />
              <FloorHint>A probation period lets you both see if the job is right. Three to six months is common and fair.</FloorHint>
            </FormSection>

            <FormSection n="4" title="Notice & holiday">
              <div>
                <Select label="Notice period" value={f.notice} onChange={onInput("notice")} options={["1 week", "2 weeks", "1 month"]} />
                <FloorHint receipt={receipt(R.notice)}>
                  The legal minimum is one week once {employeeName} has worked a month. You can offer more.
                </FloorHint>
              </div>
              <div>
                <label className="fe-label">Holiday a year</label>
                <span className="fe-input-wrap">
                  <input
                    inputMode="numeric"
                    className={"fe-input fe-tabular" + (holidayBelow ? " fe-input--error" : "")}
                    value={f.holiday}
                    onChange={onInput("holiday")}
                    style={{ paddingRight: 92 }}
                  />
                  <span style={{ position: "absolute", right: 16, font: "var(--text-body)", color: "var(--neutral-500)", pointerEvents: "none" }}>days</span>
                </span>
                {holidayOk && (
                  <ValidLine receipt={receipt(R.wtr)}>
                    {floors.holidayFloor} days including bank holidays — the legal minimum for full-time.
                  </ValidLine>
                )}
                {holidayBelow && (
                  <div className="fe-error-msg" role="alert">
                    <Icon name="error" size={18} style={{ marginTop: 1 }} />
                    <span>
                      Below the legal minimum of {floors.holidayFloor} days including bank holidays.
                      <span style={{ marginLeft: 8, display: "inline-block" }}>{receipt(R.wtr)}</span>
                    </span>
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection n="5" title="Sick pay & pension">
              <RadioCards
                label="Sick pay"
                value={f.sickPay}
                onChange={set("sickPay")}
                options={[
                  { value: "ssp", title: "Statutory Sick Pay only", description: "The legal minimum, paid at the statutory rate after the qualifying days." },
                  { value: "company", title: "Company sick pay on top", description: "You pay more than the minimum. You can set this up later." },
                ]}
              />
              <div>
                <RadioCards
                  label="Workplace pension"
                  value={f.pension}
                  onChange={set("pension")}
                  options={[
                    { value: "nest", title: "Enrol into NEST", description: "The government-backed scheme. Set up in your pension step." },
                    { value: "other", title: "Use my own scheme", description: "You already have a workplace pension provider." },
                  ]}
                />
                <FloorHint receipt={receipt(R.pension)}>
                  You must put {employeeName} into a workplace pension once he qualifies.
                </FloorHint>
              </div>
            </FormSection>

            <div style={{ marginTop: 8 }}>
              <Button variant="primary" disabled={rateBelow || holidayBelow} style={{ width: "100%" }} onClick={() => onGenerate(f)}>
                Draft and check the contract
              </Button>
              {(rateBelow || holidayBelow) && (
                <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--red-600)", textAlign: "center", margin: "10px 0 0" }}>
                  Fix the highlighted answers first — the Examiner would only send them back.
                </p>
              )}
              <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)", textAlign: "center", margin: "12px 0 0" }}>
                We draft it, then the Examiner checks it against 13 statutory requirements before you see it. About a minute.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Generation ---------------- */
type CheckState = "pending" | "checking" | "pass" | "fail" | "fixed";

function CheckRow({ meta, status }: { meta: { id: number; label: string; ref: string }; status: CheckState }) {
  const active = status === "checking";
  const pass = status === "pass" || status === "fixed";
  const fail = status === "fail";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 12,
        background: active ? "rgba(14,27,44,0.05)" : fail ? "var(--red-50)" : "transparent",
        border: fail ? "1px solid rgba(192,57,43,0.4)" : "1px solid transparent",
        opacity: status === "pending" ? 0.5 : 1,
        transition: "background-color 200ms var(--ease), opacity 200ms var(--ease)",
      }}
    >
      <span style={{ width: 24, height: 24, flex: "none", display: "grid", placeItems: "center", marginTop: 1 }}>
        {pass ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="var(--verified-green-50)" />
            <path d="M6.5 12.5 10.5 16.5 17.5 8" stroke="var(--verified-green-700)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" style={{ animation: "fe-check-draw 250ms var(--ease)" }} />
          </svg>
        ) : fail ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="var(--red-50)" />
            <path d="M8.5 8.5 15.5 15.5 M15.5 8.5 8.5 15.5" stroke="var(--red-600)" strokeWidth="2.3" strokeLinecap="round" />
          </svg>
        ) : active ? (
          <Icon name="progress_activity" size={22} style={{ color: "var(--ink-900)", animation: "fe-spin 800ms linear infinite" }} />
        ) : (
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--neutral-200)" }} />
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ font: "600 16px/1.35 var(--font-body)", color: fail ? "var(--red-600)" : "var(--ink-900)" }}>{meta.label}</span>
        <div style={{ marginTop: 5 }}>
          <StatutoryReceipt
            reference={meta.ref}
            plainEnglish="This is one of the 13 things the law says a contract must get right. The Examiner confirms it before the contract reaches you."
          />
        </div>
      </div>
    </div>
  );
}

function AssemblingDoc() {
  const bars = [
    { w: "55%", h: 9, mt: 0 },
    { w: "88%", h: 6, mt: 16 },
    { w: "82%", h: 6, mt: 8 },
    { w: "90%", h: 6, mt: 8 },
    { w: "40%", h: 9, mt: 22 },
    { w: "86%", h: 6, mt: 16 },
    { w: "78%", h: 6, mt: 8 },
    { w: "62%", h: 6, mt: 8 },
  ];
  return (
    <div className="fe-card fe-card--document" style={{ padding: "26px 24px", maxWidth: 300, margin: "0 auto", position: "relative" }}>
      <div style={{ font: "var(--text-caption)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--neutral-500)", marginBottom: 14 }}>
        Employment contract · draft
      </div>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: b.w,
            height: b.h,
            marginTop: b.mt,
            borderRadius: 3,
            background: b.h > 6 ? "var(--neutral-200)" : "var(--neutral-100)",
            opacity: 0,
            animation: "fe-view-in 400ms var(--ease) forwards",
            animationDelay: 200 + i * 220 + "ms",
          }}
        />
      ))}
    </div>
  );
}

function GenerationView({
  employeeName,
  result,
  error,
  onApproved,
  onBack,
}: {
  employeeName: string;
  result: GenerationResultView | null;
  error: string | null;
  onApproved: () => void;
  onBack: () => void;
}) {
  type Stage = "drafting" | "examining" | "fixing" | "reexamining" | "approved" | "human";
  const [stage, setStage] = useState<Stage>("drafting");
  const [checks, setChecks] = useState<CheckState[]>(() => CHECK_META.map(() => "pending"));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    if (!result) return clear;
    clear();
    setStage("drafting");
    setChecks(CHECK_META.map(() => "pending"));

    const upd = (i: number, s: CheckState) => setChecks((prev) => prev.map((v, idx) => (idx === i ? s : v)));
    const failIdx = result.firstFailCheckId ? result.firstFailCheckId - 1 : -1;
    const steps: { ms: number; run: () => void }[] = [];
    steps.push({ ms: 700, run: () => setStage("examining") });

    if (result.outcome === "approve") {
      for (let i = 0; i < 13; i++) {
        steps.push({ ms: 120, run: () => upd(i, "checking") });
        steps.push({ ms: 160, run: () => upd(i, "pass") });
      }
      steps.push({ ms: 500, run: () => setStage("approved") });
    } else {
      for (let i = 0; i <= failIdx; i++) {
        steps.push({ ms: 120, run: () => upd(i, "checking") });
        if (i === failIdx) {
          steps.push({ ms: 220, run: () => upd(i, "fail") });
          steps.push({ ms: 700, run: () => setStage("fixing") });
          steps.push({ ms: 900, run: () => upd(i, "pending") });
          steps.push({ ms: 500, run: () => setStage("reexamining") });
        } else {
          steps.push({ ms: 160, run: () => upd(i, "pass") });
        }
      }
      for (let i = failIdx; i < 13; i++) {
        steps.push({ ms: 120, run: () => upd(i, "checking") });
        if (result.outcome === "human" && i === failIdx) {
          steps.push({ ms: 260, run: () => upd(i, "fail") });
          steps.push({ ms: 700, run: () => setStage("human") });
          break;
        }
        steps.push({ ms: 200, run: () => upd(i, "pass") });
      }
      if (result.outcome === "fix") steps.push({ ms: 500, run: () => setStage("approved") });
    }

    let acc = 0;
    for (const s of steps) {
      acc += s.ms;
      timers.current.push(setTimeout(s.run, acc));
    }
    return clear;
  }, [result]);

  if (error) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <TopBar eyebrow="New employment contract" />
        <div style={{ ...scroll, display: "grid", placeItems: "center", padding: 20 }}>
          <div style={{ ...wrap, maxWidth: 460 }}>
            <Alert kind="warning" title="We couldn’t finish that just now">
              {error} Nothing is lost — try again in a moment.
            </Alert>
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Button variant="secondary" onClick={onBack}>Back to documents</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passed = checks.filter((c) => c === "pass" || c === "fixed").length;

  if (stage === "human") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <TopBar eyebrow="New employment contract" />
        <div style={{ ...scroll, display: "grid", placeItems: "center", padding: "20px 20px 40px" }}>
          <div style={{ ...wrap, maxWidth: 480 }}>
            <div className="fe-card" style={{ padding: "30px 24px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                <Icon name="visibility" size={32} style={{ color: "var(--ink-900)" }} />
              </div>
              <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 12px", textWrap: "balance" }}>This one needs human eyes</h1>
              <p style={{ font: "var(--text-body-lg)", color: "var(--neutral-700)", margin: "0 auto 8px", maxWidth: 420 }}>
                A specialist will review your contract within 1 working day. We&apos;ll message you the moment it&apos;s ready.
              </p>
              <p style={{ font: "var(--text-body)", color: "var(--neutral-500)", margin: "16px auto 0", maxWidth: 420 }}>
                Nothing you entered is lost. There is nothing more for you to do right now.
              </p>
              <div style={{ marginTop: 26 }}>
                <Button variant="secondary" style={{ width: "100%" }} onClick={onBack}>Back to documents</Button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 18, font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)" }}>
              <Icon name="schedule" size={16} />
              Typical review time today: under 4 hours
            </div>
          </div>
        </div>
      </div>
    );
  }

  // First-module-completion event arms the PWA install prompt (P15).
  if (stage === "approved") markModuleCompleted();

  if (stage === "approved") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <TopBar eyebrow="New employment contract" />
        <div style={{ ...scroll, display: "grid", placeItems: "center", padding: "20px 20px 40px" }}>
          <div style={{ ...wrap, maxWidth: 480, textAlign: "center" }}>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 24 }}>
              <VerificationSeal size={130} timestamp={result?.seal?.timestamp} hash={result?.seal?.hash} />
            </div>
            <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Approved</h1>
            <p style={{ font: "var(--text-body-lg)", color: "var(--neutral-700)", margin: "12px auto 0", maxWidth: 430 }}>
              {employeeName}&apos;s contract passed all 13 statutory checks{result?.outcome === "fix" ? " after one correction" : ""}. It&apos;s legally compliant — nothing more for you to do here.
            </p>
            {result?.outcome === "fix" && result.defect && (
              <div style={{ marginTop: 22, textAlign: "left" }}>
                <Alert kind="success" title="One issue was found and fixed automatically">
                  {result.defect.issue} Corrected before it reached you.
                </Alert>
              </div>
            )}
            <div style={{ marginTop: 26 }}>
              <Button variant="primary" style={{ width: "100%" }} onClick={onApproved}>See your contract</Button>
            </div>
            <FeedbackWidget flow="contracts" />
          </div>
        </div>
      </div>
    );
  }

  const meta = {
    drafting: { eyebrow: "Stage 1 of 3", title: "Drafting your contract", sub: "Building each clause from your answers." },
    examining: { eyebrow: "Stage 2 of 3", title: "Examining", sub: "Checking against 13 statutory requirements." },
    fixing: { eyebrow: "Stage 3", title: "Fixing an issue found", sub: "Attempt 2 of 2." },
    reexamining: { eyebrow: "Stage 3", title: "Checking the fix", sub: "Re-examining the corrected clauses." },
  }[stage];

  let pct = 6;
  if (stage === "examining") pct = 8 + (passed / 13) * 72;
  else if (stage === "fixing") pct = 82;
  else if (stage === "reexamining") pct = 84 + (passed / 13) * 12;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <TopBar eyebrow="New employment contract" />
      <div style={{ flex: "none", padding: "16px 18px 14px", borderBottom: "1px solid var(--border-hairline)", background: "var(--surface)" }}>
        <div style={wrap}>
          <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-400)", marginBottom: 6 }}>{meta.eyebrow}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {stage === "fixing" ? (
              <Icon name="build" size={22} style={{ color: "var(--amber-500)" }} />
            ) : (
              <Icon name="progress_activity" size={22} style={{ color: "var(--ink-900)", animation: "fe-spin 900ms linear infinite" }} />
            )}
            <h1 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{meta.title}</h1>
          </div>
          <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "6px 0 12px" }}>{meta.sub}</p>
          <div className="fe-progress-track">
            <div className="fe-progress-fill" style={{ width: pct + "%" }} />
          </div>
          {(stage === "examining" || stage === "reexamining") && (
            <div className="fe-tabular" style={{ font: "var(--text-caption)", color: "var(--text-secondary)", marginTop: 8 }}>
              {passed} of 13 checked
            </div>
          )}
        </div>
      </div>
      <div style={scroll}>
        <div style={{ padding: "16px 18px 34px" }}>
          <div style={wrap}>
            {stage === "drafting" ? (
              <div style={{ paddingTop: 24 }}>
                <AssemblingDoc />
                <p style={{ font: "var(--text-body)", color: "var(--neutral-500)", textAlign: "center", margin: "24px auto 0", maxWidth: 360 }}>
                  We&apos;re turning your answers into {employeeName}&apos;s contract. Then the Examiner checks every clause.
                </p>
              </div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                {stage === "fixing" && result?.defect && (
                  <div style={{ marginBottom: 16 }}>
                    <Alert kind="warning" title="Fixing an issue found — attempt 2 of 2">
                      {result.defect.issue} We&apos;re correcting it now, then checking the whole contract again.
                    </Alert>
                  </div>
                )}
                {stage === "reexamining" && (
                  <div style={{ marginBottom: 16 }}>
                    <Alert kind="info" title="Issue corrected">
                      Re-checking the corrected clauses.
                    </Alert>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {CHECK_META.map((c, i) => (
                    <CheckRow key={c.id} meta={c} status={checks[i]} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared chrome ---------------- */
function TopBar({ onBack, eyebrow, right }: { onBack?: () => void; eyebrow: string; right?: React.ReactNode }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 12px 10px 8px",
        background: "rgba(247,244,238,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-900)", flex: "none" }}
        >
          <Icon name="arrow_back" size={24} />
        </button>
      ) : (
        <span style={{ width: 8 }} />
      )}
      <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>{eyebrow}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function SaveIndicator({ saved }: { saved: boolean }) {
  return (
    <span
      className="fe-tabular"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 13px/1 var(--font-body)", color: saved ? "var(--verified-green-700)" : "var(--neutral-500)", paddingRight: 8 }}
    >
      {saved ? (
        <Icon name="check" size={14} />
      ) : (
        <Icon name="progress_activity" size={14} style={{ animation: "fe-spin 800ms linear infinite" }} />
      )}
      {saved ? "Saved just now" : "Saving…"}
    </span>
  );
}
