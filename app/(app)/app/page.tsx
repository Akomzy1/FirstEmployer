// NO-PROTOTYPE: placeholder route only — the app shell and journey home are
// built in Prompt 3 against the FirstEmployer App prototype.
export default function AppHome() {
  return (
    <main style={{ padding: "56px 24px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)" }}>
        Your journey
      </h1>
      <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", marginTop: 12 }}>
        The app shell arrives in Prompt 3.
      </p>
    </main>
  );
}
