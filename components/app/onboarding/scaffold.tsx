import * as React from "react";
import { Icon } from "@/components/system";

/** Onboarding scaffold — ported from the prototype's shared onboarding chrome. */

export function OnbScroll({
  children,
  pad = "0 20px 24px",
  innerKey,
}: {
  children: React.ReactNode;
  pad?: string;
  innerKey?: string;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div key={innerKey} style={{ padding: pad, boxSizing: "border-box", animation: "fe-view-in 220ms var(--ease)" }}>
        {children}
      </div>
    </div>
  );
}

export function OnbEyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        font: "600 12px/1 var(--font-body)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        color: "var(--neutral-500)",
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function OnbTopBar({
  onBack,
  label,
  progress,
}: {
  onBack?: () => void;
  label?: React.ReactNode;
  progress?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 14px 10px 6px",
        background: "rgba(247,244,238,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "none",
            background: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "var(--ink-900)",
            flex: "none",
          }}
        >
          <Icon name="arrow_back" size={24} />
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--ink-900)", display: "grid", placeItems: "center", flex: "none" }}>
            <Icon name="verified" size={15} fill style={{ color: "var(--verified-green-600)" }} />
          </div>
          <span style={{ font: "600 16px/1 var(--font-display)", letterSpacing: "-0.01em" }}>FirstEmployer</span>
        </div>
      )}
      <span style={{ flex: 1 }}></span>
      {label && (
        <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", paddingRight: 4 }}>
          {label}
        </span>
      )}
      {progress}
    </div>
  );
}

export function OnbHeader({
  eyebrow,
  title,
  lede,
  size = "h1",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  size?: "h1" | "h2";
}) {
  return (
    <header style={{ margin: "22px 0 24px" }}>
      {eyebrow && <OnbEyebrow>{eyebrow}</OnbEyebrow>}
      <h1 style={{ font: size === "h1" ? "var(--text-h1)" : "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0, textWrap: "balance" }}>
        {title}
      </h1>
      {lede && <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "12px 0 0", textWrap: "pretty" }}>{lede}</p>}
    </header>
  );
}

export function OnbFooter({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div
      style={{
        flex: "none",
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        background: "rgba(247,244,238,0.94)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border-hairline)",
        padding: "14px 20px calc(14px + env(safe-area-inset-bottom))",
      }}
    >
      {note && <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)", textAlign: "center", marginBottom: 10 }}>{note}</div>}
      {children}
    </div>
  );
}

export function onbWrap(max = 560): React.CSSProperties {
  return { maxWidth: max, margin: "0 auto" };
}
