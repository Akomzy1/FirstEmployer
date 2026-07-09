"use client";

import { useState } from "react";
import { Button, Icon, TextInput } from "@/components/system";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link sign in (primary), with an optional password fallback.
 * Ported from the prototype AuthScreen; wired to Supabase Auth.
 */
export function AuthForm({ next }: { next: string }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendMagicLink() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWithPassword() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else window.location.href = next;
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 22px 40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="" width={34} height={34} style={{ display: "block" }} />
          <span style={{ font: "600 22px/1 var(--font-display)", letterSpacing: "-0.01em" }}>FirstEmployer</span>
        </div>

        <div className="fe-card" style={{ padding: "28px 24px 26px" }}>
          {!sent ? (
            <>
              <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px" }}>Sign in</h1>
              <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 22px" }}>
                {mode === "magic"
                  ? "We'll email you a secure link. No password to remember."
                  : "Enter your email and password."}
              </p>

              <TextInput
                label="Your email"
                type="email"
                placeholder="you@example.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {mode === "password" && (
                <div style={{ marginTop: 16 }}>
                  <TextInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <p role="alert" style={{ font: "var(--text-caption)", fontSize: 15, color: "var(--red-600)", margin: "14px 0 0" }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
                {mode === "magic" ? (
                  <>
                    <Button variant="primary" style={{ width: "100%" }} loading={busy} disabled={!email} onClick={sendMagicLink}>
                      Send me a sign-in link
                    </Button>
                    <Button variant="tertiary" style={{ width: "100%" }} onClick={() => { setMode("password"); setError(null); }}>
                      Use a password instead
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" style={{ width: "100%" }} loading={busy} disabled={!email || !password} onClick={signInWithPassword}>
                      Sign in
                    </Button>
                    <Button variant="tertiary" style={{ width: "100%" }} onClick={() => { setMode("magic"); setError(null); }}>
                      Email me a link instead
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 54, height: 54, borderRadius: 999, background: "var(--verified-green-50)", display: "grid", placeItems: "center", marginBottom: 16 }}>
                <Icon name="mark_email_read" size={30} fill style={{ color: "var(--verified-green-700)" }} />
              </div>
              <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "0 0 8px" }}>Check your email</h1>
              <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 22px" }}>
                We&apos;ve sent a sign-in link to <strong style={{ color: "var(--ink-900)" }}>{email}</strong>. Tap it on this device and you&apos;re in.
              </p>
              <Button variant="tertiary" style={{ width: "100%" }} onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </>
          )}
        </div>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "var(--text-body)", color: "var(--neutral-500)", marginBottom: 8 }}>
            <Icon name="lock" size={17} />
            Your data is encrypted and stored in the UK.
          </div>
        </div>
      </div>
    </div>
  );
}
