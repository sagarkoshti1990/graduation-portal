/**
 * Service Worker — App Shell + Offline Navigation
 *
 * In development (localhost) this file is never activated — index.html
 * unregisters all SWs so HMR is never broken.
 *
 * In production this file is processed by InjectPrecachePlugin (webpack.config.js)
 * which replaces CACHE_NAME and the PRECACHE_URLS array with the real
 * content-hashed asset filenames from the compilation output.
 *
 * Strategy:
 *   Precached assets (JS/CSS):  Cache-First (served instantly offline)
 *   Navigation requests (HTML): Network-First, fallback to cached /index.html
 *   Cross-origin requests:      Network-Only (passthrough)
 */

const CACHE_NAME = 'gbl-shell-dev'; // __INJECT_CACHE_NAME__

const PRECACHE_URLS = ['/', '/index.html']; // __INJECT_PRECACHE_URLS__

// ---------------------------------------------------------------------------
// Install — pre-cache the complete app shell (all JS/CSS chunks)
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => {
        // Log but don't block activation; we'll fill the cache via runtime caching
        console.warn('[SW] Precache failed for some entries:', err);
      }),
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean up caches from previous builds
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

  // Passthrough cross-origin (fonts, API calls, CDN)
  if (url.origin !== self.location.origin) return;

  // Navigation requests — network-first so users always get fresh HTML,
  // fall back to cached root only when fully offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  // Static assets already in the precache (or runtime-cacheable by path) —
  // cache-first so the app works fully offline.
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

  // Everything else (API, manifest, storage-keys, etc.) — network-only
});
