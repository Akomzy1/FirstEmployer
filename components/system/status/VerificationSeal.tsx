import * as React from "react";

export interface VerificationSealProps {
  /** Examination timestamp, e.g. "14 Mar 2026, 09:41". */
  timestamp?: string;
  /** Short checklist hash, e.g. "3F9A-C21E" — the examinations.checklist_hash. */
  hash?: string;
  size?: number;
}

/** Circular examiner stamp with timestamp + short hash. Green because verification is legally earned. */
export function VerificationSeal({
  timestamp = "14 Mar 2026, 09:41",
  hash = "3F9A-C21E",
  size = 118,
}: VerificationSealProps) {
  const px = size;
  return (
    <span
      role="img"
      aria-label={"Examiner verified on " + timestamp + ", reference " + hash}
      className="fe-tabular"
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        flex: "none",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        border: "2px solid var(--verified-green-600)",
        boxShadow:
          "inset 0 0 0 3px var(--surface-raised), inset 0 0 0 4.5px var(--verified-green-600)",
        color: "var(--verified-green-700)",
        background: "var(--surface-raised)",
        textAlign: "center",
        padding: 6,
        boxSizing: "border-box",
        transform: "rotate(-6deg)",
      }}
    >
      <svg width={px * 0.19} height={px * 0.19} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M2.5 8.5 6 12l7.5-8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          style={{ animation: "fe-check-draw 250ms var(--ease)" }}
        />
      </svg>
      <span
        style={{
          font: "600 " + Math.round(px * 0.085) + "px/1.2 var(--font-body)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Examiner verified
      </span>
      <span style={{ font: "500 " + Math.round(px * 0.08) + "px/1.3 var(--font-body)" }}>{timestamp}</span>
      <span style={{ font: "600 " + Math.round(px * 0.08) + "px/1.3 var(--font-body)", letterSpacing: "0.05em" }}>
        #{hash}
      </span>
    </span>
  );
}
