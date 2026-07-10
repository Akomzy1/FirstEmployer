// The offline fallback page (P15) — precached by the service worker.
export const metadata = { title: "You're offline" };

export default function OfflinePage() {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          <span className="fe-icon" style={{ fontSize: 30, color: "var(--ink-900)" }} aria-hidden>wifi_off</span>
        </div>
        <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px" }}>
          You&apos;re offline
        </h1>
        <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: 0 }}>
          Everything you&apos;ve done is saved. Reconnect and pick up exactly where you left off.
        </p>
      </div>
    </main>
  );
}
