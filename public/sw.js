/* FirstEmployer service worker (P15).
 * Caches the app SHELL only: static assets, fonts, icons, and the offline
 * fallback page. Authenticated data is NEVER cached — navigations and API
 * calls go network-first, and only the offline fallback is served when the
 * network is gone. Everything the user typed is already saved server-side
 * per step (FR-8.6), so offline is an inconvenience, not a loss. */
const VERSION = "fe-sw-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // mutations are never cached or replayed by the SW

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Static shell assets: cache-first (immutable hashes / fonts / icons).
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/marketing/")
  ) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Navigations: network-first; offline fallback page when the network is gone.
  // Authed pages are never cache.put — nothing sensitive is stored.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }
  // Everything else (API/data): network only. No caching of authed data.
});
