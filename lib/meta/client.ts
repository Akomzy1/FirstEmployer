"use client";

/**
 * Browser side of the Meta Pixel. Safe to call anywhere — every function is a
 * no-op when the pixel isn't configured or hasn't loaded (ad blockers, dev).
 * Pair a browser event with a Conversions API event via a shared eventId so
 * Meta deduplicates (see lib/meta/capi.ts).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function newMetaEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export function fbqTrack(
  event: string,
  params?: Record<string, string | number>,
  eventId?: string,
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

/** Non-standard event names (funnel steps) go through trackCustom. */
export function fbqTrackCustom(
  event: string,
  params?: Record<string, string | number>,
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", event, params ?? {});
}
