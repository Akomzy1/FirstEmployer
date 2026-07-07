"use client";

import * as React from "react";

export interface RadioCardOption {
  value: string;
  title: string;
  description?: string;
}

export interface RadioCardsProps {
  label?: string;
  options?: Array<RadioCardOption | string>;
  value?: string;
  onChange?: (value: string) => void;
}

/** Large-tap-target radio cards for one-question-per-screen flows. */
export function RadioCards({ label, options = [], value, onChange }: RadioCardsProps) {
  return (
    <div role="radiogroup" aria-label={label}>
      {label && <span className="fe-label">{label}</span>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, title: o } : o;
          const checked = value === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              className="fe-radio-card"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange && onChange(opt.value)}
            >
              <span className="fe-radio-dot" aria-hidden="true"></span>
              <span>
                <span style={{ fontWeight: 500, display: "block" }}>{opt.title}</span>
                {opt.description && (
                  <span
                    style={{
                      font: "var(--text-caption)",
                      fontSize: 15,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {opt.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
