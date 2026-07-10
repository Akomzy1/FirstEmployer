"use client";

/* PWA install prompt (P15), per the app export's PWASheet and the design
 * intent: fires only AFTER the first module completion event, never on first
 * load; a dismissal is respected for 30 days. Android Chrome uses the deferred
 * beforeinstallprompt; iOS Safari gets add-to-home-screen instructions. */
import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/system";

const COMPLETED_KEY = "fe_module_completed_at";
const DISMISSED_KEY = "fe_pwa_dismissed_at";
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

/** Call from any flow-completion screen: arms the install prompt. */
export function markModuleCompleted() {
  try {
    if (!localStorage.getItem(COMPLETED_KEY)) localStorage.setItem(COMPLETED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — the prompt simply never arms */
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try {
      const completedAt = localStorage.getItem(COMPLETED_KEY);
      if (!completedAt) return; // never before a completion
      // A completion in THIS session doesn't prompt mid-flow; wait for the next visit.
      if (Date.now() - Number(completedAt) < 60_000) return;
      const dismissedAt = localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < DAYS_30) return;
      if (window.matchMedia("(display-mode: standalone)").matches) return; // already installed

      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
      if (isIos) {
        setIos(true);
        setShow(true);
        return;
      }
      const onPrompt = (e: Event) => {
        e.preventDefault();
        setDeferred(e as BeforeInstallPromptEvent);
        setShow(true);
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    } catch {
      return;
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch { /* best effort */ }
    setShow(false);
  }

  async function add() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
    }
    dismiss();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "auto" }}>
      <div onClick={dismiss} style={{ position: "absolute", inset: 0, background: "rgba(14,27,44,0.34)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "var(--surface-raised)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "12px 22px calc(30px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 30px -10px rgba(14,27,44,0.3)", animation: "fe-view-in 250ms var(--ease)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--neutral-200)", margin: "0 auto 20px" }} />
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={52} height={52} style={{ display: "block", flex: "none", borderRadius: 13, boxShadow: "var(--shadow-card)" }} />
          <div>
            <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "2px 0 6px" }}>Add FirstEmployer to your home screen</h3>
            <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: 0 }}>
              Your checklist, one tap away — no browser, no searching.
            </p>
          </div>
        </div>
        {ios ? (
          <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            Tap <Icon name="ios_share" size={18} style={{ color: "var(--ink-900)" }} /> then
            <strong>&ldquo;Add to Home Screen&rdquo;</strong> in Safari.
          </p>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!ios && <Button variant="primary" style={{ width: "100%" }} onClick={add}>Add to home screen</Button>}
          <Button variant="tertiary" style={{ width: "100%" }} onClick={dismiss}>Not now</Button>
        </div>
      </div>
    </div>
  );
}
