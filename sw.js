// Shelf Service Worker — PWA offline support
const CACHE = 'shelf-v1';
const PRECACHE = [
  '/shelf.html',
  '/shelf.js',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon128.png',
  '/icons/icon48.png',
];

// Install — precache core app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app shell, network-first for external resources
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network for API calls — never cache
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'api.allorigins.win') {
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => caches.match('/shelf.html'));
      })
    );
    return;
  }

  // Network-first for fonts/favicons (external)
  if (url.hostname.includes('fonts.') || url.hostname.includes('google.com')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
  }
});

// Background sync — when back online, try to flush any queued saves
self.addEventListener('sync', e => {
  if (e.tag === 'shelf-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_TRIGGER' }))
      )
    );
  }
});
