"use client";

import * as React from "react";
import { Field, type FieldProps } from "./TextInput";

export interface DateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    Omit<FieldProps, "children"> {}

/** Date input, dd/mm/yyyy, tabular figures. */
export function DateInput({ label, hint, error, receipt, ...rest }: DateInputProps) {
  return (
    <Field label={label} hint={hint} error={error} receipt={receipt}>
      <input type="date" className={"fe-input fe-tabular" + (error ? " fe-input--error" : "")} {...rest} />
    </Field>
  );
}
