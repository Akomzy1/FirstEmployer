import { Icon } from "@/components/system";

/** NO-PROTOTYPE: honest placeholder for app tabs whose modules land in later
 *  prompts. P1 features are shown, not hidden (skill gotcha #7). */
export function ComingSoon({ title, prompt, blurb }: { title: string; prompt: string; blurb: string }) {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          <Icon name="build" size={28} style={{ color: "var(--ink-900)" }} />
        </div>
        <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px" }}>{title}</h1>
        <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 12px" }}>{blurb}</p>
        <span className="fe-pill fe-status--not-started" style={{ borderColor: "var(--neutral-200)" }}>
          <Icon name="schedule" size={15} />
          Building in {prompt}
        </span>
      </div>
    </div>
  );
}
