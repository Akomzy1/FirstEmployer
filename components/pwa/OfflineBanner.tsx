"use client";

/* Flaky-network honesty (P15): a calm banner while offline. Mutations already
 * fail loud with preserved input; per-step autosave means nothing typed is
 * lost — this banner says so. */
import { useEffect, useState } from "react";
import { Icon } from "@/components/system";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 14px", background: "var(--ink-900)", color: "var(--bone-50)", font: "500 14px/1.3 var(--font-body)" }}>
      <Icon name="wifi_off" size={16} style={{ color: "var(--amber-500)" }} />
      You&apos;re offline — everything you&apos;ve done is saved. We&apos;ll reconnect automatically.
    </div>
  );
}
