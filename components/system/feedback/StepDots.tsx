import * as React from "react";

export interface StepDotsProps {
  total?: number;
  /** Zero-based index of the current step. */
  current?: number;
}

/** One-question-per-screen step indicator. */
export function StepDots({ total = 5, current = 0 }: StepDotsProps) {
  return (
    <span
      style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={"Step " + (current + 1) + " of " + total}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            "fe-step-dot" + (i < current ? " fe-step-dot--done" : i === current ? " fe-step-dot--current" : "")
          }
        ></span>
      ))}
    </span>
  );
}
