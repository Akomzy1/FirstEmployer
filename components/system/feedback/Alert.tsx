import * as React from "react";

export type AlertKind = "info" | "warning" | "success" | "legal-change";

const KIND: Record<AlertKind, { icon: string }> = {
  info: { icon: "info" },
  warning: { icon: "warning" },
  success: { icon: "check_circle" },
  "legal-change": { icon: "gavel" },
};

export interface AlertProps {
  kind?: AlertKind;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

/** Banner. Success is quiet green (relief, not celebration). legal-change is the special ink "The law changed" treatment. */
export function Alert({ kind = "info", title, children, action }: AlertProps) {
  const k = KIND[kind] || KIND.info;
  const isLegal = kind === "legal-change";
  return (
    <div className={"fe-alert fe-alert--" + kind} role={kind === "warning" || isLegal ? "alert" : "status"}>
      <span
        className="fe-icon"
        style={{
          fontSize: 22,
          marginTop: 2,
          flex: "none",
          color: isLegal
            ? "var(--amber-500)"
            : kind === "warning"
              ? "var(--amber-700)"
              : kind === "success"
                ? "var(--verified-green-700)"
                : "var(--ink-900)",
        }}
        aria-hidden="true"
      >
        {k.icon}
      </span>
      <div style={{ flex: 1 }}>
        {isLegal && (
          <div
            style={{
              font: "var(--text-caption)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--amber-500)",
              marginBottom: 4,
            }}
          >
            The law changed
          </div>
        )}
        {title && <div style={{ fontWeight: 600, marginBottom: children ? 4 : 0 }}>{title}</div>}
        {children && (
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              opacity: isLegal ? 0.85 : 1,
              color: isLegal ? "inherit" : "var(--neutral-700)",
            }}
          >
            {children}
          </div>
        )}
        {action && <div style={{ marginTop: 12 }}>{action}</div>}
      </div>
    </div>
  );
}
