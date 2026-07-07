// NO-PROTOTYPE: placeholder route only — the marketing site is built in Prompt 13
// against Homepage (standalone).html. Nothing here is a visual commitment.
export default function MarketingHome() {
  return (
    <main style={{ padding: "56px 24px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)" }}>
        FirstEmployer
      </h1>
      <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", marginTop: 12 }}>
        Marketing site lands in Prompt 13. The component library lives at{" "}
        <a href="/dev/system">/dev/system</a>.
      </p>
    </main>
  );
}
