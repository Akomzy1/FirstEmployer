"use client";

import * as React from "react";
import { Field, type FieldProps } from "./TextInput";

export interface CurrencyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    Omit<FieldProps, "children"> {}

/** Currency input with fixed £ prefix and tabular figures. */
export function CurrencyInput({ label, hint, error, receipt, ...rest }: CurrencyInputProps) {
  return (
    <Field label={label} hint={hint} error={error} receipt={receipt}>
      <span className="fe-input-wrap">
        <span className="fe-input-affix" aria-hidden="true">£</span>
        <input
          inputMode="decimal"
          className={"fe-input fe-input--prefixed fe-tabular" + (error ? " fe-input--error" : "")}
          {...rest}
        />
      </span>
    </Field>
  );
}
