/**
 * Service Worker — App Shell + Offline Navigation
 *
 * Strategy:
 *   Static assets (JS/CSS/images): Cache-First, pre-cached on install
 *   Navigation requests (HTML):    Network-First, fallback to cached /
 *   Cross-origin requests:         Network-Only (passthrough)
 */

const CACHE_NAME = 'gbl-shell-v1';

// Core app-shell files that must be available offline
const PRECACHE_URLS = ['/', '/index.html'];

// ---------------------------------------------------------------------------
// Install — pre-cache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean up old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — route requests
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests — network first, fallback to cached root
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/') || caches.match('/index.html')),
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images) — cache first
  if (
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/pwa/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }
  // All other requests (API calls etc.) — network only
});
