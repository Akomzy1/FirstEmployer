import * as React from "react";
import { VerificationSeal, type VerificationSealProps } from "../status/VerificationSeal";

export interface DocumentCardProps {
  title: React.ReactNode;
  meta?: React.ReactNode;
  /** Examined documents wear the corner seal. Never set without an examiner PASS. */
  verified?: boolean;
  sealProps?: Omit<VerificationSealProps, "size">;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Tactile, dimensional document artefact with paper grain; verified documents wear an examiner corner seal. */
export function DocumentCard({
  title,
  meta,
  verified = false,
  sealProps = {},
  children,
  style,
}: DocumentCardProps) {
  return (
    <div className="fe-card fe-card--document" style={{ padding: 28, ...style }}>
      {verified && (
        <span style={{ position: "absolute", top: -14, right: 14 }}>
          <VerificationSeal size={84} {...sealProps} />
        </span>
      )}
      <div
        style={{
          font: "var(--text-caption)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--neutral-500)",
          marginBottom: 8,
        }}
      >
        Document
      </div>
      <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", paddingRight: verified ? 84 : 0 }}>
        {title}
      </h3>
      {meta && (
        <div
          className="fe-tabular"
          style={{ font: "var(--text-caption)", fontSize: 15, color: "var(--text-secondary)", marginTop: 6 }}
        >
          {meta}
        </div>
      )}
      {children && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border-hairline)", paddingTop: 14 }}>{children}</div>
      )}
    </div>
  );
}
