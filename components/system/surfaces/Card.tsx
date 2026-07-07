import * as React from "react";

export interface CardProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Standard surface card. */
export function Card({ title, children, style }: CardProps) {
  return (
    <div className="fe-card" style={style}>
      {title && (
        <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", marginBottom: 10 }}>{title}</h3>
      )}
      {children}
    </div>
  );
}
