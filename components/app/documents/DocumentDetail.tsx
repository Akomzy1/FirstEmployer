"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, StatutoryReceipt, VerificationSeal } from "@/components/system";
import type { DetailAttempt, DetailCheckRow, DetailClause } from "@/lib/documents/detail";

export interface DocumentDetailProps {
  id: string;
  employeeName: string;
  employerName: string;
  typeLabel: string;
  createdLabel: string;
  seal: { timestamp: string; hash: string } | null;
  examinerVersion: string | null;
  configVersion: string | null;
  checks: DetailCheckRow[];
  attempts: DetailAttempt[];
  fixedCheckId?: number;
  clauses: DetailClause[];
  pdfHref: string;
}

const scroll: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };
const wrap: React.CSSProperties = { maxWidth: 720, margin: "0 auto", width: "100%", boxSizing: "border-box" };

function PassTick({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--verified-green-50)" />
      <path d="M6.5 12.5 10.5 16.5 17.5 8" stroke="var(--verified-green-700)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" style={{ animation: "fe-check-draw 250ms var(--ease)" }} />
    </svg>
  );
}
function FailMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--red-50)" />
      <path d="M8.5 8.5 15.5 15.5 M15.5 8.5 8.5 15.5" stroke="var(--red-600)" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function TopBar({ eyebrow, onBack, right }: { eyebrow: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 10px 8px", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
      <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-900)", flex: "none" }}>
        <Icon name="arrow_back" size={24} />
      </button>
      <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>{eyebrow}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

/* ------------------------- report ------------------------- */
function VerdictBanner({ employeeName, seal, examinerVersion, configVersion, fixed }: { employeeName: string; seal: DocumentDetailProps["seal"]; examinerVersion: string | null; configVersion: string | null; fixed: boolean }) {
  return (
    <div style={{ position: "relative", background: "var(--verified-green-50)", border: "1px solid rgba(30,158,106,0.35)", borderRadius: 16, padding: "26px 22px", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--verified-green-700)", marginBottom: 14 }}>
          <Icon name="balance" size={15} />
          Examiner report
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 999, background: "var(--verified-green-600)", display: "grid", placeItems: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 12.5 10.5 17 18 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" style={{ animation: "fe-check-draw 300ms var(--ease)" }} />
            </svg>
          </span>
          <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0, color: "var(--verified-green-700)" }}>Approved</h1>
        </div>
        <p style={{ font: "var(--text-body-lg)", color: "var(--ink-900)", margin: "14px 0 0", maxWidth: 440 }}>
          {employeeName}&apos;s employment contract passed all 13 statutory checks{fixed ? " — after one defect was found and fixed" : ""}. It is legally compliant.
        </p>
        {seal && (
          <div className="fe-tabular" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16, font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-500)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="schedule" size={15} />{seal.timestamp}</span>
            <span style={{ color: "var(--neutral-200)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="tag" size={15} />{seal.hash}</span>
            {examinerVersion && (<><span style={{ color: "var(--neutral-200)" }}>·</span><span>{examinerVersion}</span></>)}
            {configVersion && (<><span style={{ color: "var(--neutral-200)" }}>·</span><span>config {configVersion}</span></>)}
          </div>
        )}
      </div>
      <div style={{ flex: "none", alignSelf: "flex-start" }}>
        {seal && <VerificationSeal size={116} timestamp={seal.timestamp} hash={seal.hash} />}
      </div>
    </div>
  );
}

function ReportCheckRow({ check, index, wasFixed }: { check: DetailCheckRow; index: number; wasFixed: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "16px 4px", borderTop: index === 0 ? "none" : "1px solid var(--border-hairline)" }}>
      <span className="fe-tabular" style={{ font: "600 13px/1.7 var(--font-body)", color: "var(--neutral-400)", width: 22, flex: "none", textAlign: "right", paddingTop: 2 }}>{check.id}</span>
      <span style={{ flex: "none", paddingTop: 1 }}>{check.status === "pass" ? <PassTick size={24} /> : <FailMark size={24} />}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 17px/1.4 var(--font-body)", color: "var(--ink-900)" }}>{check.name}</div>
        <div style={{ font: "var(--text-body)", fontSize: 16, color: "var(--neutral-700)", marginTop: 4 }}>{check.detail}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <StatutoryReceipt reference={check.statutoryRef} plainEnglish={check.plainEnglish} />
          {wasFixed && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 12px/1 var(--font-body)", color: "var(--amber-700)", background: "var(--amber-50)", border: "1px solid rgba(217,122,8,0.3)", borderRadius: 999, padding: "5px 10px" }}>
              <Icon name="build" size={13} />
              Fixed on attempt 2
            </span>
          )}
        </div>
        {wasFixed && (
          <div style={{ marginTop: 12, background: "var(--surface)", border: "1px solid var(--border-hairline)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ flex: "none", marginTop: 1 }}><FailMark size={18} /></span>
              <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)" }}>
                <strong style={{ color: "var(--red-600)", fontWeight: 600 }}>Attempt 1 — rejected.</strong> A defect was found on this check, so the Examiner sent it back.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
              <span style={{ flex: "none", marginTop: 1 }}><PassTick size={18} /></span>
              <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)" }}>
                <strong style={{ color: "var(--verified-green-700)", fontWeight: 600 }}>Attempt 2 — passed.</strong> It was corrected and re-checked. You only ever saw this final version.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditTrail({ attempts, examinerVersion, sealHash }: { attempts: DetailAttempt[]; examinerVersion: string | null; sealHash?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border-hairline)", borderRadius: 12, background: "var(--surface-raised)", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: "none", background: "none", cursor: "pointer", padding: "18px 18px", font: "inherit", color: "var(--ink-900)" }}>
        <Icon name="history" size={22} style={{ color: "var(--neutral-500)", flex: "none" }} />
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 17px/1.3 var(--font-body)" }}>Audit trail</div>
          <div className="fe-tabular" style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)", marginTop: 2 }}>
            {attempts.length} attempt{attempts.length === 1 ? "" : "s"}{examinerVersion ? ` · ${examinerVersion}` : ""}
          </div>
        </div>
        <Icon name="expand_more" size={24} style={{ color: "var(--neutral-500)", flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms var(--ease)" }} />
      </button>
      {open && (
        <div style={{ padding: "0 18px 20px", animation: "fe-view-in 200ms var(--ease)" }}>
          <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
            {attempts.map((a, i) => (
              <div key={a.n} style={{ display: "flex", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none", width: 24 }}>
                  <span style={{ flex: "none" }}>{a.ok ? <PassTick size={22} /> : <FailMark size={22} />}</span>
                  {i < attempts.length - 1 && <span style={{ width: 2, flex: 1, background: "var(--border-hairline)", marginTop: 4, minHeight: 24 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < attempts.length - 1 ? 18 : 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ font: "600 16px/1.3 var(--font-body)", color: a.ok ? "var(--verified-green-700)" : "var(--red-600)" }}>Attempt {a.n} — {a.title}</span>
                    <span className="fe-tabular" style={{ font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-400)" }}>{a.timeLabel}</span>
                  </div>
                  <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", marginTop: 4 }}>{a.body}</div>
                </div>
              </div>
            ))}
          </div>
          {sealHash && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border-hairline)", font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-500)" }}>
              <Icon name="tag" size={15} />
              <span className="fe-tabular">Seal {sealHash}{examinerVersion ? ` · ${examinerVersion}` : ""}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IndependenceFooter() {
  return (
    <div style={{ display: "flex", gap: 12, padding: "18px 18px", background: "var(--ink-900)", borderRadius: 12, color: "var(--bone-50)" }}>
      <Icon name="gavel" size={22} style={{ color: "var(--verified-green-600)", flex: "none", marginTop: 1 }} />
      <p style={{ font: "var(--text-body)", fontSize: 15.5, lineHeight: 1.55, margin: 0, color: "rgba(247,244,238,0.9)" }}>
        The Examiner is independent — it has its own instructions and cannot see the generator&apos;s reasoning. If a document fails, it never reaches you.
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 14 }}>{children}</div>;
}

/* ------------------------- viewer ------------------------- */
function ClauseBlock({ clause, flash, setRef }: { clause: DetailClause; flash: boolean; setRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={setRef} data-clause={clause.id} style={{ padding: "18px 4px 22px", borderRadius: 8, transition: "background-color 400ms var(--ease)", background: flash ? "rgba(217,122,8,0.12)" : "transparent", scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span className="fe-tabular" style={{ font: "600 15px/1.2 var(--font-body)", color: "var(--neutral-400)" }}>{clause.n}.</span>
        <h3 style={{ font: "var(--text-h3)", fontSize: 20, letterSpacing: "var(--tracking-h)", margin: 0, color: "var(--ink-900)" }}>{clause.title}</h3>
      </div>
      {clause.body.map((p, i) => (
        <p key={i} style={{ font: "var(--text-body)", color: "var(--neutral-700)", margin: "0 0 10px", maxWidth: 620 }}>{p}</p>
      ))}
      {clause.statutoryRef && (
        <div style={{ marginTop: 4 }}>
          <StatutoryReceipt reference={clause.statutoryRef} plainEnglish="This clause is one of the statutory particulars the law requires, and the Examiner confirmed it before releasing the contract." />
        </div>
      )}
    </section>
  );
}

/* ------------------------- root ------------------------- */
export function DocumentDetail(props: DocumentDetailProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<"report" | "document">("report");
  const scrollRef = useRef<HTMLDivElement>(null);
  const clauseRefs = useRef<Record<string, HTMLElement | null>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [active, setActive] = useState(props.clauses[0]?.id ?? "");
  const [jumpOpen, setJumpOpen] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jump = (id: string) => {
    const box = scrollRef.current;
    const el = clauseRefs.current[id];
    if (!box || !el) return;
    box.scrollTop = Math.max(0, box.scrollTop + (el.getBoundingClientRect().top - box.getBoundingClientRect().top) - 12);
    setActive(id);
    setFlash(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1100);
  };

  const fixed = props.attempts.length > 1;
  const activeClause = props.clauses.find((c) => c.id === active) ?? props.clauses[0];

  if (screen === "report") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <TopBar eyebrow="Examiner report" onBack={() => router.push("/app/documents")} right={
          props.examinerVersion ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 12px/1 var(--font-body)", color: "var(--neutral-500)", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 999, padding: "6px 11px", marginRight: 4 }}>
              <Icon name="balance" size={13} />{props.examinerVersion}
            </span>
          ) : undefined
        } />
        <div style={scroll}>
          <div style={{ padding: "0 18px 34px" }}>
            <div style={wrap}>
              <div style={{ paddingTop: 20, marginBottom: 26 }}>
                <VerdictBanner employeeName={props.employeeName} seal={props.seal} examinerVersion={props.examinerVersion} configVersion={props.configVersion} fixed={fixed} />
              </div>
              <SectionLabel>The 13 statutory checks</SectionLabel>
              <div className="fe-card" style={{ padding: "4px 16px", marginBottom: 26 }}>
                {props.checks.map((c, i) => (
                  <ReportCheckRow key={c.id} check={c} index={i} wasFixed={fixed && c.id === props.fixedCheckId} />
                ))}
              </div>
              <SectionLabel>How this was decided</SectionLabel>
              <div style={{ marginBottom: 22 }}>
                <AuditTrail attempts={props.attempts} examinerVersion={props.examinerVersion} sealHash={props.seal?.hash} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <IndependenceFooter />
              </div>
              <Button variant="primary" style={{ width: "100%" }} onClick={() => setScreen("document")}>
                <Icon name="description" size={20} />
                Open the contract
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // document viewer
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, position: "relative" }}>
      <TopBar eyebrow="Document" onBack={() => setScreen("report")} right={
        <button onClick={() => setScreen("report")} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", font: "600 13px/1 var(--font-body)", color: "var(--verified-green-700)", marginRight: 4 }}>
          <Icon name="balance" size={15} />Examiner report
        </button>
      } />
      <div style={{ flex: "none", padding: "14px 18px 16px", borderBottom: "1px solid var(--border-hairline)", background: "var(--surface)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "var(--text-caption)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--neutral-500)", marginBottom: 6 }}>{props.typeLabel}</div>
              <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{props.employeeName}</h1>
              <div className="fe-tabular" style={{ display: "flex", alignItems: "center", gap: 8, font: "var(--text-caption)", fontSize: 14, color: "var(--text-secondary)", marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--verified-green-700)", font: "600 14px/1 var(--font-body)" }}>
                  <Icon name="verified" size={15} />Examiner verified
                </span>
                <span style={{ color: "var(--neutral-200)" }}>·</span>
                <span>{props.employerName}</span>
                <span style={{ color: "var(--neutral-200)" }}>·</span>
                <span>{props.createdLabel}</span>
              </div>
            </div>
            {props.seal && <span style={{ flex: "none" }}><VerificationSeal size={78} timestamp={props.seal.timestamp} hash={props.seal.hash} /></span>}
          </div>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a href={props.pdfHref} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary"><Icon name="download" size={19} />Download PDF</Button>
            </a>
            <Button variant="secondary" disabled title="Coming soon">
              <Icon name="draw" size={19} />Send for signature
              <span style={{ font: "700 10px/1 var(--font-body)", letterSpacing: "0.04em", color: "var(--amber-700)", background: "var(--amber-50)", border: "1px solid rgba(217,122,8,0.3)", borderRadius: 999, padding: "3px 6px", marginLeft: 2 }}>P1</span>
            </Button>
          </div>
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ padding: "0 18px 40px", boxSizing: "border-box" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 40 }}>
            <nav className="fe-doc-nav" style={{ position: "sticky", top: 0, alignSelf: "flex-start", width: 220, flex: "none", paddingTop: 16 }}>
              <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 12, paddingLeft: 12 }}>Clauses</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {props.clauses.map((c) => (
                  <button key={c.id} onClick={() => jump(c.id)} style={{ display: "flex", alignItems: "center", gap: 9, textAlign: "left", border: "none", cursor: "pointer", borderRadius: 8, padding: "8px 12px", font: active === c.id ? "600 14px/1.35 var(--font-body)" : "500 14px/1.35 var(--font-body)", color: active === c.id ? "var(--ink-900)" : "var(--neutral-500)", background: active === c.id ? "rgba(14,27,44,0.06)" : "transparent" }}>
                    <span className="fe-tabular" style={{ width: 16, flex: "none", color: "var(--neutral-400)" }}>{c.n}</span>{c.title}
                  </button>
                ))}
              </div>
            </nav>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button className="fe-doc-jump" onClick={() => setJumpOpen(true)} style={{ position: "sticky", top: 12, zIndex: 20, width: "100%", marginTop: 12, marginBottom: 14, alignItems: "center", gap: 8, cursor: "pointer", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 999, padding: "11px 16px", boxShadow: "var(--shadow-card)", font: "600 15px/1 var(--font-body)", color: "var(--ink-900)" }}>
                <Icon name="list" size={19} style={{ color: "var(--neutral-500)" }} />
                <span className="fe-tabular" style={{ flex: 1, textAlign: "left" }}>{activeClause ? `${activeClause.n}. ${activeClause.title}` : "Jump to a clause"}</span>
                <Icon name="expand_more" size={20} style={{ color: "var(--neutral-500)" }} />
              </button>
              <article className="fe-card fe-card--document" style={{ padding: "22px 22px" }}>
                <header style={{ borderBottom: "1px solid var(--border-hairline)", paddingBottom: 20, marginBottom: 8 }}>
                  <div style={{ font: "var(--text-caption)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--neutral-500)", marginBottom: 10 }}>Contract of employment</div>
                  <h2 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{props.employerName} and {props.employeeName}</h2>
                  <p style={{ font: "var(--text-body)", color: "var(--neutral-500)", margin: "10px 0 0" }}>Written statement of employment particulars, given under the Employment Rights Act 1996.</p>
                </header>
                {props.clauses.map((c) => (
                  <ClauseBlock key={c.id} clause={c} flash={flash === c.id} setRef={(el) => { clauseRefs.current[c.id] = el; }} />
                ))}
                {props.seal && (
                  <footer style={{ borderTop: "1px solid var(--border-hairline)", marginTop: 12, paddingTop: 20, display: "flex", alignItems: "center", gap: 10, font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-500)" }}>
                    <Icon name="lock" size={15} />
                    <span className="fe-tabular">Examiner verified {props.seal.timestamp} · #{props.seal.hash}</span>
                  </footer>
                )}
              </article>
            </div>
          </div>
        </div>
      </div>

      {jumpOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
          <div onClick={() => setJumpOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(14,27,44,0.34)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "78%", background: "var(--surface-raised)", borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -8px 30px -10px rgba(14,27,44,0.3)", display: "flex", flexDirection: "column", animation: "fe-view-in 200ms var(--ease)" }}>
            <div style={{ padding: "12px 22px 8px", flex: "none" }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--neutral-200)", margin: "0 auto 14px" }} />
              <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>Jump to a clause</div>
            </div>
            <div style={{ overflowY: "auto", padding: "6px 14px 26px" }}>
              {props.clauses.map((c) => (
                <button key={c.id} onClick={() => { jump(c.id); setJumpOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", border: "none", cursor: "pointer", borderRadius: 10, padding: "13px 12px", font: "500 16px/1.3 var(--font-body)", color: "var(--ink-900)", background: active === c.id ? "rgba(14,27,44,0.06)" : "transparent" }}>
                  <span className="fe-tabular" style={{ width: 20, flex: "none", color: "var(--neutral-400)", font: "600 14px/1 var(--font-body)" }}>{c.n}</span>{c.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
