import * as React from "react";

export interface ProgressBarProps {
  value?: number;
  label?: React.ReactNode;
  /** Autosave indicator copy; pass null to hide. */
  savedText?: React.ReactNode | null;
}

/** Progress bar with autosave indicator. Fill is ink until 100% — green is earned at complete. */
export function ProgressBar({ value = 0, label, savedText = "Saved just now" }: ProgressBarProps) {
  const complete = value >= 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        {label && <span style={{ font: "var(--text-label)" }}>{label}</span>}
        <span
          className="fe-tabular"
          style={{
            font: "var(--text-caption)",
            color: complete ? "var(--verified-green-700)" : "var(--text-secondary)",
          }}
        >
          {Math.round(value)}%
        </span>
      </div>
      <div
        className="fe-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <div
          className={"fe-progress-fill" + (complete ? " fe-progress-fill--complete" : "")}
          style={{ width: value + "%" }}
        ></div>
      </div>
      {savedText && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginTop: 8,
            font: "var(--text-caption)",
            color: "var(--text-secondary)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
          {savedText}
        </div>
      )}
    </div>
  );
}
