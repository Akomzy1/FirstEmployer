"use client";

import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

/** Primary actions are verified green — green is earned, so one primary per view. */
export function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={"fe-btn fe-btn--" + variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="fe-spinner" aria-hidden="true"></span>}
      <span>{children}</span>
    </button>
  );
}
