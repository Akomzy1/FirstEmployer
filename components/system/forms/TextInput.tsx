"use client";

import * as React from "react";

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Optional StatutoryReceipt rendered beside the error message. */
  receipt?: React.ReactNode;
  children?: React.ReactNode;
}

/** Shared field chrome: label, control, hint or error (with optional statutory receipt). */
export function Field({ label, hint, error, receipt, children }: FieldProps) {
  return (
    <div style={{ width: "100%" }}>
      <label className="fe-label">{label}</label>
      {children}
      {error ? (
        <div className="fe-error-msg" role="alert">
          <span className="fe-icon" style={{ fontSize: 18, marginTop: 1 }} aria-hidden="true">error</span>
          <span>
            {error}
            {receipt && <span style={{ marginLeft: 8, display: "inline-block" }}>{receipt}</span>}
          </span>
        </div>
      ) : hint ? (
        <div className="fe-hint">{hint}</div>
      ) : null}
    </div>
  );
}

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    Omit<FieldProps, "children"> {}

/** Plain text input with label + inline validation. */
export function TextInput({ label, hint, error, receipt, ...rest }: TextInputProps) {
  return (
    <Field label={label} hint={hint} error={error} receipt={receipt}>
      <input className={"fe-input" + (error ? " fe-input--error" : "")} {...rest} />
    </Field>
  );
}
