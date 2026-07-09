"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DeadlineChip, Icon, StatusPill, type DeadlineGrade } from "@/components/system";

export type ModuleState = "complete" | "in-progress" | "available" | "locked" | "always";

export interface JourneyModule {
  id: string;
  n: string;
  title: string;
  state: ModuleState;
  note: string;
  /** Route to open, or null when the module isn't built yet. */
  route: string | null;
  receipt?: { reference: string; plain: string };
}

interface Deadline {
  label: string;
  grade: DeadlineGrade;
  due: string;
}

export function JourneyHome({
  ownerName,
  businessName,
  modules,
  nextStepTitle,
  completedCount,
  totalCount,
  deadlines,
}: {
  ownerName: string;
  businessName: string;
  modules: JourneyModule[];
  nextStepTitle: string | null;
  completedCount: number;
  totalCount: number;
  deadlines: Deadline[];
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<JourneyModule | null>(null);
  const pct = Math.round((completedCount / totalCount) * 100);

  function openModule(mod: JourneyModule) {
    if (mod.state === "locked") return;
    if (mod.route) router.push(mod.route);
    else setSheet(mod);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 40px", boxSizing: "border-box" }}>
        {/* header */}
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: 7 }}>
              {businessName}
            </div>
            <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>
              Welcome, {ownerName}
            </h1>
            <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "6px 0 0" }}>
              {nextStepTitle ? "Here's where you're up to. Let's keep going." : "You're all set up."}
            </p>
          </div>
        </header>

        {/* continue hero */}
        {nextStepTitle && (
          <div style={{ background: "var(--ink-900)", color: "var(--bone-50)", borderRadius: "var(--radius-card)", padding: "22px 22px 24px", boxShadow: "var(--shadow-card)", marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", opacity: 0.7, marginBottom: 14 }}>
              <Icon name="bookmark" size={16} fill />
              Continue where you left off
            </div>
            <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--verified-green-600)", marginBottom: 8 }}>
              Your next step
            </div>
            <h2 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "0 0 18px", color: "var(--bone-50)" }}>
              {nextStepTitle}
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", font: "var(--text-caption)", marginBottom: 8 }}>
              <span style={{ opacity: 0.85 }}>Your path to green</span>
              <span className="fe-tabular" style={{ fontWeight: 600 }}>{completedCount} of {totalCount} steps done</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(247,244,238,0.18)", overflow: "hidden", marginBottom: 20 }}>
              <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "var(--verified-green-600)" }}></div>
            </div>
            <Button variant="primary" style={{ width: "100%" }} onClick={() => { const m = modules.find((x) => x.title === nextStepTitle); if (m) openModule(m); }}>
              Continue: {nextStepTitle}
            </Button>
          </div>
        )}

        {/* journey map */}
        <section style={{ marginBottom: 30 }}>
          <SectionLabel>Your path to green</SectionLabel>
          <div>
            {modules.map((mod, i) => (
              <JourneyRow key={mod.id} mod={mod} last={i === modules.length - 1} onOpen={openModule} />
            ))}
          </div>
        </section>

        {/* deadlines */}
        {deadlines.length > 0 && (
          <section style={{ marginBottom: 30 }}>
            <SectionLabel>Deadlines</SectionLabel>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -20px", padding: "2px 20px 6px", scrollbarWidth: "none" }}>
              {deadlines.map((d, i) => (
                <div key={i} style={{ flex: "0 0 auto", minWidth: 220, width: 220, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 18px", boxSizing: "border-box" }}>
                  <div style={{ font: "600 15px/1.3 var(--font-body)", marginBottom: 12 }}>{d.label}</div>
                  <DeadlineChip grade={d.grade}>{d.due}</DeadlineChip>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* assistant bar */}
        <button
          onClick={() => router.push("/app/assistant")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderRadius: 999, border: "1px solid var(--border-hairline)", background: "var(--surface-raised)", boxShadow: "var(--shadow-popover)", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--ink-900)", display: "grid", placeItems: "center", flex: "none" }}>
            <Icon name="auto_awesome" size={18} fill style={{ color: "var(--verified-green-600)" }} />
          </div>
          <span style={{ font: "500 16px/1 var(--font-body)", color: "var(--neutral-500)", flex: 1 }}>Ask anything about hiring</span>
          <Icon name="arrow_forward" size={20} style={{ color: "var(--ink-900)" }} />
        </button>
      </div>

      {/* module sheet (for modules without a route yet) */}
      {sheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 45 }}>
          <div onClick={() => setSheet(null)} style={{ position: "absolute", inset: 0, background: "rgba(14,27,44,0.34)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "var(--surface-raised)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "12px 22px calc(30px + env(safe-area-inset-bottom))", boxShadow: "var(--shadow-popover)", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--neutral-200)", margin: "0 auto 18px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{sheet.title}</h3>
              {sheet.state === "complete" && <StatusPill status="complete" />}
              {sheet.state === "in-progress" && <StatusPill status="in-progress" />}
            </div>
            <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 16px" }}>{sheet.note}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, font: "var(--text-caption)", color: "var(--text-secondary)", padding: "10px 12px", background: "rgba(14,27,44,0.05)", borderRadius: 10 }}>
                <Icon name="build" size={16} />
                We&apos;re building this step next — it&apos;ll open here when it&apos;s ready.
              </div>
              <Button variant="tertiary" style={{ width: "100%" }} onClick={() => setSheet(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function JourneyNode({ state, n }: { state: ModuleState; n: string }) {
  const base: React.CSSProperties = { width: 40, height: 40, borderRadius: 999, flex: "none", display: "grid", placeItems: "center", boxSizing: "border-box" };
  if (state === "complete") return <div style={{ ...base, background: "var(--verified-green-600)", color: "#fff" }}><Icon name="check" size={24} /></div>;
  if (state === "in-progress") return <div style={{ ...base, background: "rgba(14,27,44,0.08)", border: "2px solid var(--ink-900)", color: "var(--ink-900)", font: "600 16px/1 var(--font-body)" }}>{n}</div>;
  if (state === "available") return <div style={{ ...base, background: "var(--surface-raised)", border: "2px solid var(--ink-900)", color: "var(--ink-900)", font: "600 16px/1 var(--font-body)" }}>{n}</div>;
  if (state === "always") return <div style={{ ...base, background: "rgba(14,27,44,0.08)", color: "var(--ink-900)" }}><Icon name="forum" size={21} fill /></div>;
  return <div style={{ ...base, background: "var(--surface-raised)", border: "1.5px dashed var(--neutral-200)", color: "var(--neutral-400)" }}><Icon name="lock" size={19} /></div>;
}

function JourneyRow({ mod, last, onOpen }: { mod: JourneyModule; last: boolean; onOpen: (m: JourneyModule) => void }) {
  const locked = mod.state === "locked";
  const connectorGreen = mod.state === "complete";

  const rightMeta = () => {
    if (mod.state === "complete") return <StatusPill status="complete" />;
    if (mod.state === "in-progress") return <StatusPill status="in-progress" />;
    if (mod.state === "available") return <span style={{ font: "600 13px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--verified-green-700)" }}>Next</span>;
    if (mod.state === "always") return <span style={{ font: "500 14px/1 var(--font-body)", color: "var(--neutral-500)" }}>Always open</span>;
    return <Icon name="lock" size={18} style={{ color: "var(--neutral-400)" }} />;
  };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
        <JourneyNode state={mod.state} n={mod.n} />
        {!last && <div style={{ width: 2, flex: 1, minHeight: 22, background: connectorGreen ? "var(--verified-green-600)" : "var(--neutral-200)", margin: "2px 0" }} />}
      </div>
      <button
        onClick={locked ? undefined : () => onOpen(mod)}
        disabled={locked}
        style={{ flex: 1, textAlign: "left", border: "none", background: "none", cursor: locked ? "default" : "pointer", padding: "0 0 22px", opacity: locked ? 0.6 : 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
          <span style={{ font: "600 17px/1.2 var(--font-body)", color: "var(--ink-900)" }}>{mod.title}</span>
          {rightMeta()}
        </div>
        <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>{mod.note}</p>
      </button>
    </div>
  );
}
