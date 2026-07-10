"use client";

/* Registers the service worker (P15). Production only — dev servers and the SW
 * cache fight each other. */
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure degrades to a normal website — never block.
    });
  }, []);
  return null;
}
