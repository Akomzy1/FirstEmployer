"use client";

/* Flow-completion feedback widget (FR-8.5, P14). Quiet, one-tap, optional
 * comment. Relief register — thanks, never celebration. */
import { useState } from "react";
import { Icon } from "@/components/system";
import { submitFeedback } from "@/app/(app)/app/feedback-action";

export function FeedbackWidget({ flow }: { flow: "status" | "setup" | "contracts" | "rtw" | "dashboard" }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "rated" | "sent">("idle");

  async function send(r: number, c?: string) {
    try {
      await submitFeedback({ flow, rating: r, comment: c });
    } catch {
      // Feedback must never block a flow — best effort.
    }
  }

  if (state === "sent") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", font: "500 14px/1.4 var(--font-body)", color: "var(--neutral-500)" }}>
        <Icon name="check" size={16} style={{ color: "var(--verified-green-700)" }} />
        Thanks — that helps us make this clearer.
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 12, padding: "14px 16px", marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ font: "500 14px/1.4 var(--font-body)", color: "var(--neutral-700)", flex: 1, minWidth: 160 }}>
          How was this step?
        </span>
        <span role="radiogroup" aria-label="Rate this step" style={{ display: "inline-flex", gap: 2 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => {
                setRating(n);
                setState("rated");
                void send(n);
              }}
              style={{ border: "none", background: "none", cursor: "pointer", padding: 3, fontSize: 22, lineHeight: 1, color: n <= rating ? "var(--amber-500)" : "var(--neutral-200)" }}
            >
              ★
            </button>
          ))}
        </span>
      </div>
      {state === "rated" && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <input
            className="fe-input"
            style={{ minHeight: 44, flex: 1 }}
            placeholder="Anything we could make clearer? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { void send(rating, comment); setState("sent"); } }}
          />
          <button
            type="button"
            onClick={() => { void send(rating, comment); setState("sent"); }}
            className="fe-btn fe-btn--secondary"
            style={{ minHeight: 44, padding: "0 16px" }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
