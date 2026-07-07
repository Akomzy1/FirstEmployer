/**
 * PostHog stub — initialised only when NEXT_PUBLIC_POSTHOG_KEY is set.
 * Full analytics wiring is a later prompt; every call is safe to make now.
 */
import posthog from "posthog-js";

let initialised = false;

export function initAnalytics() {
  if (initialised || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    capture_pageview: true,
  });
  initialised = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialised) return;
  posthog.capture(event, properties);
}
