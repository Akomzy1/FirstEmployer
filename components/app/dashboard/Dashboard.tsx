"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DeadlineChip, Icon, StatusPill, StatutoryReceipt } from "@/components/system";
import type { DashboardResult, SegmentId, SegmentState } from "@/lib/rules/obligations";
import type { LegalChangeView } from "@/lib/data/dashboard";
import { generateVariationLetter } from "@/app/(app)/app/dashboard/actions";

/** Per-segment copy: receipt + verified/needed lines + fix link (per prototype). */
export interface SegmentCopy {
  id: SegmentId;
  label: string;
  receipt: { ref: string; plain: string };
  verified: string;
  needed: string;
  fix: string;
  href: string;
}

export interface DashboardProps {
  result: DashboardResult;
  copy: SegmentCopy[];
  legalChange: LegalChangeView | null;
  todayLabel: string;
}

const STATUS_COLOUR: Record<SegmentState, string> = {
  verified: "var(--verified-green-600)",
  attention: "var(--amber-500)",
  overdue: "var(--red-600)",
  pending: "var(--neutral-200)",
};

/* ============================================ RING */
function ComplianceRing({ result, size = 232 }: { result: DashboardResult; size?: number }) {
  const cx = 100, cy = 100, r = 80, sw = 15;
  const C = 2 * Math.PI * r;
  const n = result.segments.length;
  const gap = 13;
  const segLen = C / n - gap;
  const toneRing =
    result.tone === "green" ? "var(--verified-green-600)" : result.tone === "amber" ? "var(--amber-500)" : "var(--red-600)";

  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none", animation: "fe-ring-in 350ms var(--ease)" }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block" }}>
        <g transform="rotate(-90 100 100)">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--neutral-100)" strokeWidth={sw} />
          {result.segments.map((s, i) => (
            <circle
              key={s.id}
              cx={cx} cy={cy} r={r} fill="none"
              stroke={STATUS_COLOUR[s.state]} strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={`${segLen} ${C - segLen}`}
              strokeDashoffset={-(i * C) / n}
              style={{ transition: "stroke 250ms var(--ease)", transitionDelay: `${i * 35}ms` }}
            />
          ))}
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        {result.tone === "green" ? (
          <svg width="34" height="34" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ marginBottom: 2 }}>
            <path d="M2.5 8.5 6 12l7.5-8" stroke="var(--verified-green-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" style={{ animation: "fe-check-draw 300ms var(--ease) 200ms both" }} />
          </svg>
        ) : (
          <Icon name={result.tone === "amber" ? "pending_actions" : "error"} size={30} style={{ color: toneRing, marginBottom: 2 }} />
        )}
        <span className="fe-tabular" style={{ font: "600 40px/1 var(--font-display)", letterSpacing: "-0.02em", color: "var(--ink-900)" }}>{result.centre.big}</span>
        <span className="fe-tabular" style={{ font: "500 13px/1.3 var(--font-body)", color: "var(--neutral-500)" }}>{result.centre.small}</span>
      </div>
    </div>
  );
}

/* ============================================ OBLIGATION LIST */
function OverduePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="fe-pill" style={{ background: "var(--red-50)", color: "var(--red-600)", border: "1px solid rgba(192,57,43,0.35)" }}>
      <Icon name="error" size={16} />{children}
    </span>
  );
}
function AttentionPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="fe-pill" style={{ background: "var(--amber-50)", color: "var(--amber-700)" }}>
      <Icon name="pending_actions" size={16} />{children}
    </span>
  );
}
function PendingPill({ children }: { children: React.ReactNode }) {
  return <StatusPill status="not-started">{children}</StatusPill>;
}

function ObligationItem({ copy, state, deadline, expanded, onToggle, onFix }: {
  copy: SegmentCopy;
  state: SegmentState;
  deadline: { grade: "comfortable" | "approaching" | "urgent" | "overdue"; label: string } | null;
  expanded: boolean;
  onToggle: () => void;
  onFix: () => void;
}) {
  const verified = state === "verified";
  const pill = verified ? <StatusPill status="complete">Compliant</StatusPill>
    : state === "overdue" ? <OverduePill>Overdue</OverduePill>
      : state === "pending" ? <PendingPill>Not started</PendingPill>
        : <AttentionPill>Needs attention</AttentionPill>;

  return (
    <div style={{ borderBottom: "1px solid var(--border-hairline)" }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 66,
        padding: "12px 4px", background: expanded ? "rgba(14,27,44,0.03)" : "none", border: "none",
        cursor: "pointer", textAlign: "left", transition: "background-color 150ms var(--ease)",
      }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: STATUS_COLOUR[state], flex: "none", boxShadow: verified || state === "pending" ? "none" : `0 0 0 4px ${state === "overdue" ? "var(--red-50)" : "var(--amber-50)"}` }} />
        <span style={{ flex: 1, minWidth: 0, font: "600 17px/1.25 var(--font-body)", color: "var(--ink-900)" }}>{copy.label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          {!verified && deadline && <DeadlineChip grade={deadline.grade}>{deadline.label}</DeadlineChip>}
          {pill}
          <Icon name={expanded ? "expand_less" : "expand_more"} size={22} style={{ color: "var(--neutral-400)" }} />
        </span>
      </button>
      {expanded && (
        <div style={{ padding: "2px 4px 20px 26px", animation: "fe-pop-in 200ms var(--ease)" }}>
          <p style={{ font: "var(--text-body)", color: verified ? "var(--neutral-700)" : "var(--ink-900)", margin: "0 0 14px", maxWidth: 520 }}>
            {verified ? copy.verified : copy.needed}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
            <StatutoryReceipt reference={copy.receipt.ref} plainEnglish={copy.receipt.plain} />
            {verified ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--text-caption)", color: "var(--verified-green-700)" }}>
                <Icon name="verified" size={16} fill /> Verified
              </span>
            ) : (
              <button onClick={onFix} style={{
                display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer",
                font: "600 15px/1 var(--font-body)", padding: 0,
                color: state === "overdue" ? "var(--red-600)" : "var(--verified-green-700)",
              }}>
                {copy.fix}
                <Icon name="arrow_forward" size={17} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================ TIMELINE */
const GRADE_DOT: Record<string, string> = {
  comfortable: "var(--neutral-400)",
  approaching: "var(--amber-500)",
  urgent: "var(--urgent-600)",
  overdue: "var(--red-600)",
};

function TimelineStrip({ result, todayLabel }: { result: DashboardResult; todayLabel: string }) {
  const months: { frac: number; m: string }[] = [];
  const start = new Date();
  for (let i = 0; i <= 3; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const days = Math.max(0, Math.round((d.getTime() - start.getTime()) / 86400000));
    if (days <= 90) months.push({ frac: Math.min(days / 90, 0.99), m: d.toLocaleDateString("en-GB", { month: "short" }) });
  }

  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <SectionLabel>Next 90 days</SectionLabel>
        <span style={{ font: "var(--text-caption)", color: "var(--neutral-400)" }}>Today · {todayLabel}</span>
      </div>
      <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "18px 14px 14px", overflowX: "auto", scrollbarWidth: "none" }}>
        {result.timeline.length === 0 ? (
          <p style={{ font: "var(--text-body)", color: "var(--neutral-500)", margin: "6px 8px 10px" }}>
            Nothing is due in the next 90 days.
          </p>
        ) : (
          <div style={{ position: "relative", minWidth: 620, height: 118, padding: "0 8px" }}>
            {result.timeline.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: `${Math.min(Math.max(m.frac, 0.04), 0.96) * 100}%`, top: 0, transform: "translateX(-50%)", width: 130, textAlign: "center" }}>
                <div className="fe-tabular" style={{ font: "600 13px/1.3 var(--font-body)", color: GRADE_DOT[m.grade] }}>
                  {new Date(m.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                </div>
                <div style={{ font: "500 12px/1.3 var(--font-body)", color: "var(--neutral-500)", marginTop: 2 }}>{m.label}</div>
                <div style={{ width: 2, height: 12, background: GRADE_DOT[m.grade], margin: "6px auto 0" }} />
                <div style={{ width: 12, height: 12, borderRadius: 999, background: GRADE_DOT[m.grade], margin: "0 auto", boxShadow: "0 0 0 3px var(--surface-raised)" }} />
              </div>
            ))}
            <div style={{ position: "absolute", left: 8, right: 8, top: 82, height: 2, background: "var(--neutral-200)" }} />
            <div style={{ position: "absolute", left: 0, top: 74 }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, background: "var(--ink-900)", border: "3px solid var(--surface-raised)", boxShadow: "0 0 0 1px var(--ink-900)" }} />
            </div>
            {months.map((mm, i) => (
              <div key={i} style={{ position: "absolute", left: `${mm.frac * 100}%`, top: 96, transform: "translateX(-50%)", font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-400)" }}>{mm.m}</div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================ LEGAL-CHANGE CARD (J4) */
function LegalChangeCard({ lc }: { lc: LegalChangeView }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function variation(employeeId: string) {
    setBusy(employeeId);
    setError(null);
    try {
      const res = await generateVariationLetter(employeeId);
      router.push(`/app/documents/${res.documentId}`);
    } catch (e) {
      setError((e as Error).message || "Couldn't generate the letter just now. Nothing is lost.");
      setBusy(null);
    }
  }

  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-document)", background: "#FDFBF5", backgroundImage: "var(--grain)" }}>
        <div style={{ background: "var(--ink-900)", color: "var(--bone-50)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--amber-500)", marginBottom: 8 }}>
            <Icon name="gavel" size={17} />
            <span style={{ font: "var(--text-caption)", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}>The law changed · {lc.effectiveLabel}</span>
          </div>
          <h2 className="fe-tabular" style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: 0, color: "var(--bone-50)" }}>
            The National Living Wage is now {lc.headlineRate}.
          </h2>
          <p style={{ font: "var(--text-body)", color: "rgba(247,244,238,0.82)", margin: "8px 0 0" }}>
            We checked every one of your team against the new rates.
          </p>
        </div>
        <div style={{ padding: "6px 22px 20px" }}>
          {lc.impacts.map((e, i) => {
            const settled = e.ok || lc.resolved;
            return (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 0", borderTop: "1px solid var(--border-hairline)" }}>
                <span style={{ width: 34, height: 34, borderRadius: 999, flex: "none", display: "grid", placeItems: "center", background: settled ? "var(--verified-green-50)" : "var(--red-50)", color: settled ? "var(--verified-green-700)" : "var(--red-600)" }}>
                  <Icon name={settled ? "check" : "priority_high"} size={20} fill={settled} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ font: "600 17px/1.25 var(--font-body)", color: "var(--ink-900)" }}>{e.name}</span>
                    {e.roleLine && <span style={{ font: "var(--text-caption)", color: "var(--neutral-500)" }}>{e.roleLine}</span>}
                  </div>
                  <p className="fe-tabular" style={{ font: "var(--text-body)", color: settled ? "var(--neutral-700)" : "var(--ink-900)", margin: "6px 0 0" }}>
                    {!e.ok && lc.resolved ? "Fixed with an examined variation letter — pay now meets the new minimum." : e.detail}
                  </p>
                  {!e.ok && !lc.resolved && (
                    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                      <Button variant="primary" loading={busy === e.employeeId} onClick={() => variation(e.employeeId)}>
                        Generate variation letter
                      </Button>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--text-caption)", color: "var(--neutral-500)" }}>
                        <Icon name="verified_user" size={16} />
                        It will be examined before you see it.
                      </span>
                    </div>
                  )}
                  {error && busy === null && !e.ok && (
                    <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--red-600)", margin: "10px 0 0" }}>{error}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            <StatutoryReceipt reference="NMWA 1998 s.1" plainEnglish="Almost every worker must be paid at least the minimum wage for their age. The rates go up every April." guidanceUrl="https://www.gov.uk/national-minimum-wage-rates" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================ P1 MATRIX (visible, locked) */
function MultiEmployeeMatrix({ copy }: { copy: SegmentCopy[] }) {
  return (
    <section style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <SectionLabel>Your whole team</SectionLabel>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--text-caption)", fontWeight: 600, color: "var(--terracotta-500)", background: "var(--terracotta-50)", borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>
          <Icon name="workspace_premium" size={15} />
          Growth tier — coming soon
        </span>
      </div>
      <div style={{ position: "relative", borderRadius: "var(--radius-card)", border: "1px solid var(--border-hairline)", background: "var(--surface-raised)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto", scrollbarWidth: "none", filter: "saturate(0.55)", opacity: 0.72 }}>
          <table className="fe-tabular" style={{ borderCollapse: "collapse", minWidth: 560, width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "14px 16px", font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)" }}>Employee</th>
                {copy.map((o) => (
                  <th key={o.id} style={{ padding: "14px 6px", font: "600 12px/1 var(--font-body)", color: "var(--neutral-500)", whiteSpace: "nowrap" }}>{o.label.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid var(--border-hairline)" }}>
                <td style={{ padding: "14px 16px", font: "600 15px/1.2 var(--font-body)", color: "var(--ink-900)" }}>Your team</td>
                {copy.map((o) => (
                  <td key={o.id} style={{ textAlign: "center", padding: "14px 6px" }}>
                    <span style={{ width: 12, height: 12, borderRadius: 999, background: "var(--neutral-200)", display: "inline-block" }} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(247,244,238,0.35)", backdropFilter: "blur(1px)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center" }}>
            <Icon name="lock" size={22} style={{ color: "var(--ink-900)" }} />
          </div>
          <div style={{ font: "600 15px/1.3 var(--font-body)", color: "var(--ink-900)", textAlign: "center", maxWidth: 260 }}>Track every employee in one grid</div>
          <div style={{ font: "var(--text-caption)", color: "var(--neutral-500)", textAlign: "center", maxWidth: 260 }}>Available when you add your second employee.</div>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 14 }}>{children}</div>;
}

/* ============================================ SCREEN */
export function Dashboard({ result, copy, legalChange, todayLabel }: DashboardProps) {
  const router = useRouter();
  const [open, setOpen] = useState<SegmentId | null>(null);
  const toneText =
    result.tone === "green" ? "var(--verified-green-700)" : result.tone === "amber" ? "var(--amber-700)" : "var(--red-600)";

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "16px 20px 28px", boxSizing: "border-box" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 6 }}>Compliance dashboard</div>
          <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: 0 }}>Everything the law asks of you, in one place.</p>
        </div>

        {/* hero: ring + headline */}
        <section style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "26px 22px 24px", marginBottom: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 4 }}>
          <ComplianceRing result={result} />
          <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "20px 0 0", color: toneText }}>{result.headline}</h1>
          <p className="fe-tabular" style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "8px 0 0", maxWidth: 440 }}>{result.subline}</p>
        </section>

        {/* obligations */}
        <section style={{ marginBottom: 30 }}>
          <SectionLabel>Your obligations</SectionLabel>
          <div style={{ borderTop: "1px solid var(--border-hairline)" }}>
            {copy.map((c) => {
              const seg = result.segments.find((s) => s.id === c.id)!;
              return (
                <ObligationItem
                  key={c.id}
                  copy={c}
                  state={seg.state}
                  deadline={seg.deadline}
                  expanded={open === c.id}
                  onToggle={() => setOpen(open === c.id ? null : c.id)}
                  onFix={() => router.push(c.href)}
                />
              );
            })}
          </div>
        </section>

        <TimelineStrip result={result} todayLabel={todayLabel} />
        {legalChange && <LegalChangeCard lc={legalChange} />}
        <MultiEmployeeMatrix copy={copy} />
      </div>
    </div>
  );
}
