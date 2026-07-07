"use client";

import * as React from "react";
import { Field, type FieldProps } from "./TextInput";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    Omit<FieldProps, "children"> {
  options?: string[];
}

/** Native select styled to match inputs. */
export function Select({ label, hint, error, receipt, options = [], ...rest }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} receipt={receipt}>
      <select className={"fe-input" + (error ? " fe-input--error" : "")} {...rest}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}
