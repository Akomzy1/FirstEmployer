// NO-PROTOTYPE: placeholder route only — the admin console is built in
// Prompt 14 against Admin Console (standalone).html. Desktop-first.
export default function AdminHome() {
  return (
    <main style={{ padding: "56px 24px", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)" }}>
        Admin console
      </h1>
      <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", marginTop: 12 }}>
        Built in Prompt 14. Service-role access only.
      </p>
    </main>
  );
}
