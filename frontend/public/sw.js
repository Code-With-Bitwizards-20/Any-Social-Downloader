/*
  Progressive Web App Service Worker for Vite SPA
  - Precaches core app shell after first visit
  - Runtime-caches same-origin GET requests for faster subsequent loads
  - Safe fallbacks and versioned cache to avoid update issues
  - Works on http://localhost and HTTPS in production

  Notes:
  - Avoid caching API POST/PUT/DELETE.
  - Update CACHE_VERSION when making significant changes to caching strategy.
*/

const CACHE_VERSION = 'v1';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const PRECACHE = `precache-${CACHE_VERSION}`;

// List of core assets to precache (kept minimal; Vite will fingerprint built assets)
// If you add new top-level pages or static assets you always want offline, list them here.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  // Skip waiting so updates take control faster after install
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  self.clients.claim();
  // Cleanup old caches when version changes
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only same-origin caching to avoid issues with third-party resources
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    return; // Let the network handle it
  }

  // Strategy: Stale-While-Revalidate for same-origin GETs
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);

      const networkFetch = fetch(request)
        .then((response) => {
          // Only cache valid, basic (same-origin) responses
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          // If offline and no network, fall back to cache only
          return cached || Promise.reject('offline');
        });

      // Return cached first if present, otherwise wait for network
      return cached || networkFetch;
    })()
  );
});

// Optional: Listen for skipWaiting message to activate new SW without reload
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
