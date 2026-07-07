"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

export interface StatutoryReceiptProps {
  /** Statutory reference, e.g. "ERA 1996 s.1". */
  reference: string;
  /** Plain-English explanation (reading age 9). */
  plainEnglish: string;
  /** Link to the official guidance (GOV.UK etc.). */
  guidanceUrl?: string;
  defaultOpen?: boolean;
}

/** Tappable legal-reference chip that expands into a plain-English popover (reading age 9). */
export function StatutoryReceipt({
  reference,
  plainEnglish,
  guidanceUrl = "#",
  defaultOpen = false,
}: StatutoryReceiptProps) {
  const [open, setOpen] = useState(defaultOpen);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" className="fe-receipt" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="fe-icon" style={{ fontSize: 14 }} aria-hidden="true">balance</span>
        {reference}
      </button>
      {open && (
        <span
          className="fe-receipt__pop"
          role="dialog"
          aria-label={"What " + reference + " says"}
          style={{ display: "block", left: 0, top: "100%" }}
        >
          <span
            style={{
              font: "var(--text-caption)",
              fontWeight: 600,
              color: "var(--neutral-500)",
              display: "block",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            What the law says
          </span>
          <span style={{ font: "var(--text-body)", fontSize: 16, display: "block", color: "var(--ink-900)" }}>
            {plainEnglish}
          </span>
          <a
            href={guidanceUrl}
            style={{
              font: "var(--text-label)",
              color: "var(--ink-900)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 10,
              textUnderlineOffset: 3,
            }}
          >
            Read the official guidance
            <span className="fe-icon" style={{ fontSize: 16 }} aria-hidden="true">open_in_new</span>
          </a>
        </span>
      )}
    </span>
  );
}
