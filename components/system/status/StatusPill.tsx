import * as React from "react";

export type Status = "not-started" | "in-progress" | "blocked" | "complete";

const STATES: Record<Status, { label: string; icon: string | null }> = {
  "not-started": { label: "Not started", icon: null },
  "in-progress": { label: "In progress", icon: "progress_activity" },
  blocked: { label: "Blocked", icon: "front_hand" },
  complete: { label: "Complete", icon: "check" },
};

export interface StatusPillProps {
  status?: Status;
  children?: React.ReactNode;
}

/** Task status pill. Complete is the only green state — green is earned. */
export function StatusPill({ status = "not-started", children }: StatusPillProps) {
  const s = STATES[status] || STATES["not-started"];
  return (
    <span className={"fe-pill fe-status--" + status}>
      {status === "complete" ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2.5 8.5 6 12l7.5-8"
            stroke="var(--verified-green-700)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="24"
            strokeDashoffset="0"
            style={{ animation: "fe-check-draw 250ms var(--ease)" }}
          />
        </svg>
      ) : s.icon ? (
        <span className="fe-icon" style={{ fontSize: 15 }} aria-hidden="true">
          {s.icon}
        </span>
      ) : null}
      {children || s.label}
    </span>
  );
}
