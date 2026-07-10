"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Icon, ProgressBar, StatutoryReceipt, VerificationSeal } from "@/components/system";
import { exportAuditPack, getArtefactDownloadUrl, type ExportPackResult } from "@/app/(app)/app/vault/actions";
import type { VaultArtefact } from "@/lib/data/vault";
import { AUDIT_PRESETS, inScope, type AuditPresetId } from "@/lib/rules/audit-pack";

export interface RetentionCopy {
  text: string;
  reference: string;
  plainEnglish: string;
  guidanceUrl: string;
}

export interface VaultFlowProps {
  artefacts: VaultArtefact[];
  retention: Record<string, RetentionCopy>;
  /** RTW follow-up reminder copy (config/PRD-derived, e.g. "90, 30 and 7 days"). */
  rtwReminderCopy: string;
}

type View = "grid" | "detail" | "export";
type ExportStep = "scope" | "preview" | "progress" | "ready";

const TYPES: { key: string; label: string; icon: string }[] = [
  { key: "determination", label: "Determinations", icon: "balance" },
  { key: "contract", label: "Contracts", icon: "contract" },
  { key: "rtw", label: "RTW records", icon: "badge" },
  { key: "certificate", label: "Certificates", icon: "workspace_premium" },
  { key: "letter", label: "Letters", icon: "mail" },
];
const typeMeta = (k: string) => TYPES.find((t) => t.key === k) ?? TYPES[4];

const scroll: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };
const wrap: React.CSSProperties = { maxWidth: 680, margin: "0 auto", width: "100%", boxSizing: "border-box" };

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 14, ...style }}>{children}</div>;
}

function TopBar({ eyebrow, onBack, right }: { eyebrow: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 10px 8px", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
      {onBack ? (
        <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-900)", flex: "none" }}>
          <Icon name="arrow_back" size={24} />
        </button>
      ) : <span style={{ width: 8 }} />}
      <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>{eyebrow}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function ArtefactIcon({ type, size = 46 }: { type: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, flex: "none", background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center" }}>
      <Icon name={typeMeta(type).icon} size={Math.round(size * 0.5)} style={{ color: "var(--ink-900)" }} />
    </div>
  );
}

function VersionChip({ version, current }: { version: string; current: boolean }) {
  return (
    <span className="fe-tabular" style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 12px/1 var(--font-body)", letterSpacing: "0.02em", color: current ? "var(--verified-green-700)" : "var(--neutral-500)", background: current ? "var(--verified-green-50)" : "var(--neutral-100)", borderRadius: 999, padding: "5px 10px", whiteSpace: "nowrap", flex: "none" }}>
      {current && <Icon name="history" size={13} />}
      {version}{current ? " · current" : ""}
    </span>
  );
}

function FilterDropdown({ icon, value, options, onChange }: { icon: string; value: string; options: { id: string; label: string; count?: number }[]; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);
  const current = options.find((o) => o.id === value) ?? options[0];
  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 14px/1 var(--font-body)", color: "var(--ink-900)", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 999, padding: "9px 12px 9px 13px", cursor: "pointer", whiteSpace: "nowrap" }}>
        <Icon name={icon} size={17} style={{ color: "var(--neutral-500)" }} />
        {current.label}
        <Icon name={open ? "expand_less" : "expand_more"} size={18} style={{ color: "var(--neutral-400)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, minWidth: 200, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 12, boxShadow: "var(--shadow-popover)", padding: 6, animation: "fe-view-in 150ms var(--ease)" }}>
          {options.map((o) => {
            const on = o.id === value;
            return (
              <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", font: on ? "600 15px/1.2 var(--font-body)" : "500 15px/1.2 var(--font-body)", color: "var(--ink-900)", background: on ? "rgba(14,27,44,0.06)" : "transparent", border: "none", borderRadius: 8, padding: "10px 10px", cursor: "pointer" }}>
                <span style={{ flex: 1 }}>{o.label}</span>
                {o.count != null && <span className="fe-tabular" style={{ font: "600 13px/1 var(--font-body)", color: "var(--neutral-400)" }}>{o.count}</span>}
                {on && <Icon name="check" size={17} style={{ color: "var(--verified-green-700)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

function ArtefactCard({ a, onOpen }: { a: VaultArtefact; onOpen: (a: VaultArtefact) => void }) {
  return (
    <button type="button" onClick={() => onOpen(a)} className={"fe-card" + (a.examined ? " fe-card--document" : "")} style={{ position: "relative", textAlign: "left", cursor: "pointer", width: "100%", padding: "20px 20px 18px", display: "flex", flexDirection: "column", font: "inherit", minHeight: 176, boxSizing: "border-box" }}>
      {a.examined && a.seal && (
        <span style={{ position: "absolute", top: -13, right: 14 }}>
          <VerificationSeal size={62} timestamp={a.seal.timestamp} hash={a.seal.hash} />
        </span>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <ArtefactIcon type={a.kind} />
        <div style={{ paddingTop: 2, paddingRight: a.examined ? 54 : 0 }}>
          <div style={{ font: "600 11px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)" }}>{typeMeta(a.kind).label.replace(/s$/, "")}</div>
        </div>
      </div>
      <h3 style={{ font: "600 18px/1.28 var(--font-display)", letterSpacing: "var(--tracking-h)", color: "var(--ink-900)", margin: 0 }}>{a.title}</h3>
      <div className="fe-tabular" style={{ display: "flex", alignItems: "center", gap: 7, font: "500 14px/1.3 var(--font-body)", color: "var(--neutral-500)", marginTop: 8, flexWrap: "wrap" }}>
        <Icon name={a.employeeId ? "person" : "store"} size={15} />
        {a.personName}
        <span style={{ color: "var(--neutral-200)" }}>·</span>
        {a.dateLabel}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 16 }}>
        <VersionChip version={a.version} current={a.current} />
        {a.examined ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 13px/1 var(--font-body)", color: "var(--verified-green-700)" }}>
            <Icon name="check" size={15} />
            Examiner verified
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "600 13px/1 var(--font-body)", color: "var(--neutral-400)" }}>
            <Icon name="lock" size={14} />
            Stored
          </span>
        )}
      </div>
    </button>
  );
}

export function VaultFlow({ artefacts, retention, rtwReminderCopy }: VaultFlowProps) {
  const [view, setView] = useState<View>("grid");
  const [detail, setDetail] = useState<VaultArtefact | null>(null);
  const [type, setType] = useState("all");
  const [emp, setEmp] = useState("all");
  const [exportStep, setExportStep] = useState<ExportStep>("scope");
  const [presetId, setPresetId] = useState<AuditPresetId>("everything");
  const [pack, setPack] = useState<ExportPackResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of artefacts) c[a.kind] = (c[a.kind] || 0) + 1;
    return c;
  }, [artefacts]);

  const empOptions = useMemo(() => {
    const byId = new Map<string, { label: string; count: number }>();
    let businessCount = 0;
    for (const a of artefacts) {
      if (!a.employeeId) { businessCount++; continue; }
      const cur = byId.get(a.employeeId) ?? { label: a.personName, count: 0 };
      cur.count++;
      byId.set(a.employeeId, cur);
    }
    return [
      { id: "all", label: "Everyone", count: artefacts.length },
      ...Array.from(byId.entries()).map(([id, v]) => ({ id, label: v.label, count: v.count })),
      ...(businessCount ? [{ id: "business", label: "Business-wide", count: businessCount }] : []),
    ];
  }, [artefacts]);

  const filtered = artefacts.filter(
    (a) => (type === "all" || a.kind === type) && (emp === "all" || (emp === "business" ? !a.employeeId : a.employeeId === emp)),
  );
  const anyFilter = type !== "all" || emp !== "all";

  async function download(a: VaultArtefact) {
    if (!a.filePath) return;
    setDownloading(true);
    try {
      if (a.source === "document") {
        window.open(`/app/documents/${a.sourceId}/pdf`, "_blank");
      } else if (a.source === "determination") {
        window.open(`/app/determinations/${a.sourceId}/pdf`, "_blank");
      } else {
        const url = await getArtefactDownloadUrl(a.filePath);
        window.open(url, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  }

  function startExport(id: AuditPresetId) {
    setPresetId(id);
    setExportStep("preview");
  }

  async function generatePack() {
    setExportStep("progress");
    setExportError(null);
    setPct(0);
    // Honest progress: the work is one server call; the bar reflects elapsed
    // effort and completes only when the pack really exists.
    const timer = setInterval(() => setPct((p) => Math.min(92, p + 4)), 180);
    try {
      const result = await exportAuditPack(presetId);
      clearInterval(timer);
      setPct(100);
      setPack(result);
      setTimeout(() => setExportStep("ready"), 350);
    } catch (e) {
      clearInterval(timer);
      setExportError((e as Error).message || "Couldn't build the pack just now.");
      setExportStep("preview");
    }
  }

  const shell = (children: React.ReactNode) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>{children}</div>
  );

  /* ------------- EMPTY ------------- */
  if (artefacts.length === 0) {
    return shell(
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={{ ...wrap, maxWidth: 620 }}>
        <header style={{ margin: "26px 0 22px" }}>
          <Label style={{ marginBottom: 10 }}>Evidence vault</Label>
          <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Your evidence, all in one place</h1>
          <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>
            Nothing here yet. As you complete each step, the proof lands here on its own — nothing to file, nothing to lose.
          </p>
        </header>
        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "26px 22px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--neutral-100)", color: "var(--neutral-700)", borderRadius: 999, padding: "6px 13px", font: "600 13px/1 var(--font-body)", marginBottom: 18 }}>
            <Icon name="folder_open" size={16} />
            What will collect here
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TYPES.map((t, i) => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                  <Icon name={t.icon} size={21} style={{ color: "var(--ink-900)" }} />
                </div>
                <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "20px 2px 0", font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)" }}>
          <Icon name="lock" size={16} style={{ marginTop: 1, flex: "none" }} />
          Stored in the UK, encrypted. When an inspector calls, it&apos;s all here — in order, in one file.
        </div>
      </div></div></div>,
    );
  }

  /* ------------- DETAIL ------------- */
  if (view === "detail" && detail) {
    const a = detail;
    const r = a.retention ? retention[a.retention] : null;
    const multiVersion = a.versions.length > 1;
    return shell(<>
      <TopBar eyebrow={typeMeta(a.kind).label.replace(/s$/, "")} onBack={() => setView("grid")} right={
        a.examined ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "600 12px/1 var(--font-body)", color: "var(--verified-green-700)", paddingRight: 6 }}>
            <Icon name="verified" size={16} fill style={{ color: "var(--verified-green-600)" }} />Verified
          </span>
        ) : undefined
      } />
      <div style={scroll}><div style={{ padding: "0 20px 20px" }}><div style={{ ...wrap, maxWidth: 600 }}>
        <header style={{ margin: "20px 0 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{a.title}</h1>
            <span style={{ flex: "none", marginTop: 4 }}><VersionChip version={a.version} current={a.current} /></span>
          </div>
          <div className="fe-tabular" style={{ display: "flex", alignItems: "center", gap: 8, font: "500 15px/1.4 var(--font-body)", color: "var(--neutral-500)", flexWrap: "wrap" }}>
            <Icon name={a.employeeId ? "person" : "store"} size={16} />
            {a.personName}
            <span style={{ color: "var(--neutral-200)" }}>·</span>
            {a.dateLabel}
          </div>
          <p style={{ font: "var(--text-body-lg)", color: "var(--neutral-700)", margin: "14px 0 0" }}>{a.summary}</p>
        </header>

        {a.followUpDue && (
          <div style={{ marginBottom: 28 }}>
            <Alert kind="warning" title={`Follow-up due ${new Date(a.followUpDue + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`}>
              This permission is time-limited. Do a follow-up check before it ends to keep your legal defence. We&apos;ll remind you {rtwReminderCopy} before.
            </Alert>
          </div>
        )}

        <section style={{ marginBottom: 28 }}>
          <Label style={{ marginBottom: 16 }}>{multiVersion ? "Version history" : "History"}</Label>
          <div>
            {a.versions.map((v, i) => {
              const last = i === a.versions.length - 1;
              return (
                <div key={v.v} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 999, flex: "none", display: "grid", placeItems: "center", background: v.current ? "var(--verified-green-600)" : "var(--neutral-100)", border: v.current ? "none" : "1px solid var(--border-hairline)" }}>
                      {v.current ? <Icon name="check" size={18} style={{ color: "#fff" }} /> : <Icon name="history" size={18} style={{ color: "var(--neutral-500)" }} />}
                    </div>
                    {!last && <div style={{ width: 2, flex: 1, minHeight: 22, background: "var(--neutral-200)", margin: "4px 0" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
                      <span className="fe-tabular" style={{ font: "600 16px/1.2 var(--font-body)", color: "var(--ink-900)" }}>{v.v}</span>
                      <span style={{ font: "600 11px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: 999, padding: "4px 9px", color: v.current ? "var(--verified-green-700)" : "var(--neutral-500)", background: v.current ? "var(--verified-green-50)" : "var(--neutral-100)" }}>
                        {v.current ? "Current" : "Superseded"}
                      </span>
                      <span className="fe-tabular" style={{ marginLeft: "auto", font: "500 13px/1 var(--font-body)", color: "var(--neutral-400)" }}>{v.dateLabel}</span>
                    </div>
                    <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: "0 0 8px" }}>{v.note}</p>
                    {v.sealHash && (
                      <div className="fe-tabular" style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 13px/1 var(--font-body)", color: v.current ? "var(--verified-green-700)" : "var(--neutral-400)" }}>
                        <Icon name={v.current ? "verified" : "history_toggle_off"} size={15} fill={v.current} />
                        {v.current ? "Examiner verified" : "Examiner verified at the time"} · #{v.sealHash}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {r && (
          <section style={{ marginBottom: 8 }}>
            <Label>How long we keep this</Label>
            <div style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--neutral-100)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", padding: "16px 18px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", display: "grid", placeItems: "center", flex: "none" }}>
                <Icon name="schedule" size={20} style={{ color: "var(--neutral-700)" }} />
              </div>
              <div>
                <div style={{ font: "600 15px/1.4 var(--font-body)", color: "var(--ink-900)", marginBottom: 8 }}>{r.text}</div>
                <StatutoryReceipt reference={r.reference} plainEnglish={r.plainEnglish} guidanceUrl={r.guidanceUrl} />
              </div>
            </div>
          </section>
        )}
      </div></div></div>
      <div style={{ flex: "none", padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--border-hairline)", background: "rgba(247,244,238,0.96)", backdropFilter: "blur(12px)" }}>
        <div style={{ ...wrap, maxWidth: 600, display: "flex", gap: 10, flexDirection: "column" }}>
          <Button variant="primary" style={{ width: "100%" }} loading={downloading} disabled={!a.filePath} onClick={() => download(a)}>
            <Icon name="download" size={19} />
            Download
          </Button>
          <Button variant="secondary" style={{ width: "100%" }} onClick={() => { setView("export"); setExportStep("scope"); }}>
            <Icon name="inventory_2" size={18} />
            Add to an audit pack
          </Button>
        </div>
      </div>
    </>);
  }

  /* ------------- EXPORT ------------- */
  if (view === "export") {
    const preset = AUDIT_PRESETS.find((p) => p.id === presetId)!;
    const scoped = artefacts.filter((a) => inScope(presetId, a)).sort((x, y) => x.iso.localeCompare(y.iso));

    if (exportStep === "progress") {
      return shell(
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 26px" }}>
          <div style={{ maxWidth: 460, width: "100%", margin: "0 auto", animation: "fe-view-in 220ms var(--ease)" }}>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 26 }}>
              <div style={{ width: 78, height: 78, borderRadius: 20, background: "var(--ink-900)", display: "grid", placeItems: "center", boxShadow: "var(--shadow-card)" }}>
                <Icon name="inventory_2" size={40} style={{ color: "var(--verified-green-600)" }} />
              </div>
            </div>
            <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px", textAlign: "center" }}>Building your audit pack</h1>
            <p className="fe-tabular" style={{ font: "var(--text-body)", color: "var(--neutral-500)", margin: "0 0 28px", textAlign: "center" }}>
              {scoped.length} documents, indexed in date order.
            </p>
            <ProgressBar value={pct} />
          </div>
        </div>,
      );
    }

    if (exportStep === "ready" && pack) {
      return shell(<>
        <TopBar eyebrow="Audit pack" onBack={() => { setView("grid"); setExportStep("scope"); }} />
        <div style={scroll}><div style={{ padding: "0 20px 36px" }}><div style={{ ...wrap, maxWidth: 560 }}>
          <div style={{ textAlign: "center", margin: "30px 0 26px" }}>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 18 }}>
              <span style={{ width: 66, height: 66, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--verified-green-50)", border: "2px solid var(--verified-green-600)" }}>
                <Icon name="check" size={30} style={{ color: "var(--verified-green-700)" }} />
              </span>
            </div>
            <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px", textWrap: "balance" }}>Your audit pack is ready</h1>
            <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 auto", maxWidth: 400 }}>
              If an inspector calls, this is everything — in order, in one file.
            </p>
          </div>
          <div className="fe-card fe-card--document" style={{ padding: 0, overflow: "hidden", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15, padding: "20px 20px 18px" }}>
              <div style={{ width: 56, height: 68, borderRadius: 8, background: "var(--ink-900)", flex: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 4px 12px -4px rgba(14,27,44,0.5)" }}>
                <Icon name="picture_as_pdf" size={26} style={{ color: "var(--verified-green-600)" }} />
                <span style={{ font: "700 9px/1 var(--font-body)", letterSpacing: "0.08em", color: "var(--bone-50)" }}>PDF</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 18px/1.28 var(--font-display)", letterSpacing: "var(--tracking-h)", color: "var(--ink-900)" }}>{preset.label} pack</div>
                <div className="fe-tabular" style={{ font: "500 15px/1.4 var(--font-body)", color: "var(--neutral-500)", marginTop: 4 }}>
                  {pack.included} documents, indexed, {pack.generatedLabel}
                </div>
                {pack.skipped > 0 && (
                  <div style={{ font: "var(--text-caption)", fontSize: 13, color: "var(--amber-700)", marginTop: 4 }}>
                    {pack.skipped} item{pack.skipped === 1 ? " has" : "s have"} no stored file yet and {pack.skipped === 1 ? "was" : "were"} left out.
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", borderTop: "1px solid var(--border-hairline)" }}>
              {[["schedule", "Chronological"], ["format_list_numbered", "Indexed"], ["lock", "UK-stored"]].map(([ic, l], i) => (
                <div key={l} className="fe-tabular" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 6px", font: "600 13px/1 var(--font-body)", color: "var(--neutral-700)", borderLeft: i === 0 ? "none" : "1px solid var(--border-hairline)" }}>
                  <Icon name={ic} size={16} style={{ color: "var(--neutral-500)" }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            <a href={pack.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
              <Button variant="primary" style={{ width: "100%" }}>
                <Icon name="download" size={19} />
                Download the pack
              </Button>
            </a>
          </div>
          <button type="button" onClick={() => { setView("grid"); setExportStep("scope"); }} style={{ border: "none", background: "none", cursor: "pointer", font: "600 15px/1 var(--font-body)", color: "var(--neutral-500)", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 2px", width: "100%", justifyContent: "center" }}>
            <Icon name="arrow_back" size={17} />Back to the vault
          </button>
        </div></div></div>
      </>);
    }

    if (exportStep === "preview") {
      return shell(<>
        <TopBar eyebrow="Audit pack" onBack={() => setExportStep("scope")} />
        <div style={scroll}><div style={{ padding: "0 20px 20px" }}><div style={{ ...wrap, maxWidth: 620 }}>
          <header style={{ margin: "18px 0 20px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--neutral-100)", color: "var(--neutral-700)", borderRadius: 999, padding: "6px 13px", font: "600 13px/1 var(--font-body)", marginBottom: 14 }}>
              <Icon name={preset.icon} size={16} />
              {preset.label}
            </div>
            <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>What&apos;s in the pack</h1>
            <p className="fe-tabular" style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>
              {scoped.length} documents, in date order — oldest first, exactly how an inspector reads them.
            </p>
          </header>
          {exportError && <div style={{ marginBottom: 16 }}><Alert kind="warning" title="Couldn't build the pack">{exportError}</Alert></div>}
          <div style={{ position: "relative", paddingLeft: 4 }}>
            {scoped.map((d, i) => {
              const last = i === scoped.length - 1;
              return (
                <div key={d.id} style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                    <div className="fe-tabular" style={{ width: 30, height: 30, borderRadius: 999, background: "var(--ink-900)", color: "var(--bone-50)", display: "grid", placeItems: "center", font: "600 13px/1 var(--font-body)", flex: "none" }}>{i + 1}</div>
                    {!last && <div style={{ width: 2, flex: 1, minHeight: 14, background: "var(--neutral-200)", margin: "4px 0" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: "12px 14px" }}>
                    <ArtefactIcon type={d.kind} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{d.title}</div>
                      <div className="fe-tabular" style={{ font: "500 13px/1.3 var(--font-body)", color: "var(--neutral-500)", marginTop: 2 }}>
                        {d.personName} · {d.dateLabel}{d.current && d.versions.length > 1 ? " · " + d.version : ""}
                      </div>
                    </div>
                    {d.examined && <Icon name="verified" size={19} fill style={{ color: "var(--verified-green-600)", flex: "none" }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div></div></div>
        <div style={{ flex: "none", padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--border-hairline)", background: "rgba(247,244,238,0.96)", backdropFilter: "blur(12px)" }}>
          <div style={{ ...wrap, maxWidth: 620, display: "flex", gap: 10, flexDirection: "column" }}>
            <Button variant="primary" style={{ width: "100%" }} disabled={scoped.length === 0} onClick={generatePack}>
              <Icon name="inventory_2" size={19} />
              Generate audit pack
            </Button>
            <Button variant="tertiary" style={{ width: "100%" }} onClick={() => setExportStep("scope")}>Choose a different scope</Button>
          </div>
        </div>
      </>);
    }

    // scope
    return shell(<>
      <TopBar eyebrow="Audit pack" onBack={() => setView("grid")} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={{ ...wrap, maxWidth: 620 }}>
        <header style={{ margin: "18px 0 22px" }}>
          <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Build an audit pack</h1>
          <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>
            Who&apos;s asking? Pick one and we&apos;ll gather the right documents — in order, in one file.
          </p>
        </header>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
          {AUDIT_PRESETS.map((p) => {
            const count = artefacts.filter((a) => inScope(p.id, a)).length;
            return (
              <button key={p.id} type="button" onClick={() => startExport(p.id)} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "18px 18px", cursor: "pointer", boxSizing: "border-box" }}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                  <Icon name={p.icon} size={27} style={{ color: "var(--ink-900)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 18px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{p.label}</div>
                  <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", marginTop: 3 }}>{p.desc}</div>
                  <div className="fe-tabular" style={{ font: "600 13px/1 var(--font-body)", color: "var(--neutral-400)", marginTop: 9 }}>{count} document{count === 1 ? "" : "s"}</div>
                </div>
                <Icon name="chevron_right" size={24} style={{ color: "var(--neutral-400)", flex: "none" }} />
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Icon name="info" size={18} style={{ color: "var(--neutral-400)", marginTop: 2, flex: "none" }} />
          <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", margin: 0 }}>
            You&apos;ll see exactly what goes in before anything is generated. Nothing leaves your account until you say so.
          </p>
        </div>
      </div></div></div>
    </>);
  }

  /* ------------- GRID ------------- */
  const chips = [
    { id: "all", label: "All", icon: "apps", count: artefacts.length },
    ...TYPES.map((t) => ({ id: t.key, label: t.label, icon: t.icon, count: typeCounts[t.key] || 0 })),
  ];
  return shell(<>
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(247,244,238,0.94)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
      <div style={{ ...wrap, maxWidth: 900, padding: "16px 20px 10px" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 7 }}>Evidence vault</div>
          <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Everything, in order</h1>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 0 6px", WebkitOverflowScrolling: "touch" }}>
          {chips.map((c) => {
            const on = c.id === type;
            return (
              <button key={c.id} type="button" onClick={() => setType(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, flex: "none", font: "600 14px/1 var(--font-body)", color: on ? "var(--bone-50)" : "var(--ink-900)", background: on ? "var(--ink-900)" : "var(--surface-raised)", border: "1px solid " + (on ? "var(--ink-900)" : "var(--border-hairline)"), borderRadius: 999, padding: "9px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
                <Icon name={c.icon} size={17} style={{ color: on ? "var(--verified-green-600)" : "var(--neutral-500)" }} />
                {c.label}
                <span className="fe-tabular" style={{ font: "600 12px/1 var(--font-body)", color: on ? "rgba(247,244,238,0.7)" : "var(--neutral-400)" }}>{c.count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <FilterDropdown icon="person" value={emp} options={empOptions} onChange={setEmp} />
          {anyFilter && (
            <button type="button" onClick={() => { setType("all"); setEmp("all"); }} style={{ border: "none", background: "none", cursor: "pointer", font: "600 14px/1 var(--font-body)", color: "var(--neutral-500)", display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 6px" }}>
              <Icon name="close" size={16} />Clear
            </button>
          )}
        </div>
      </div>
    </div>

    <div style={scroll}>
      <div style={{ padding: "0 20px 34px" }}>
        <div style={{ ...wrap, maxWidth: 900 }}>
          <div className="fe-tabular" style={{ font: "500 14px/1.4 var(--font-body)", color: "var(--neutral-500)", padding: "18px 2px 16px" }}>
            {filtered.length} document{filtered.length === 1 ? "" : "s"}{anyFilter ? " match your filters" : ", newest first"}
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px 30px" }}>
              <div style={{ width: 58, height: 58, borderRadius: 999, background: "var(--neutral-100)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Icon name="filter_alt_off" size={28} style={{ color: "var(--neutral-500)" }} />
              </div>
              <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px" }}>Nothing matches those filters</h3>
              <p style={{ font: "var(--text-body)", color: "var(--neutral-500)", margin: "0 auto 20px", maxWidth: 340 }}>
                Every document is still here — try widening the filters to find it.
              </p>
              <Button variant="secondary" onClick={() => { setType("all"); setEmp("all"); }}>Clear filters</Button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 26 }}>
              {filtered.map((a) => <ArtefactCard key={a.id} a={a} onOpen={(x) => { setDetail(x); setView("detail"); }} />)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "26px 2px 0", font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)" }}>
            <Icon name="lock" size={16} style={{ marginTop: 1, flex: "none" }} />
            Stored in the UK, encrypted. Download or share any document any time.
          </div>
        </div>
      </div>
    </div>

    <div style={{ flex: "none", padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--border-hairline)", background: "rgba(247,244,238,0.96)", backdropFilter: "blur(12px)" }}>
      <Button variant="primary" style={{ width: "100%" }} onClick={() => { setView("export"); setExportStep("scope"); }}>
        <Icon name="inventory_2" size={19} />
        Export audit pack
      </Button>
    </div>
  </>);
}
