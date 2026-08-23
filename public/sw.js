/**
 * KM Progressive Web App Service Worker
 * Features:
 * - App Shell Pre-caching (HTML, icons, fonts)
 * - Safe asset caching with Stale-While-Revalidate
 * - Full bypass for Firebase Realtime Database, Firestore & Auth (Live multiplayer data is never cached stale)
 * - Instant update activation via 'SKIP_WAITING'
 */

const CACHE_NAME = 'km-pwa-v2.1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable.svg'
];

// Install Event: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Don't auto skipWaiting unconditionally to allow in-app "Update Now" prompt
      // but ready to be activated
    })
  );
});

// Message listener: allows in-app "Update Now" prompt to trigger instant activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate Event: purge older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: strictly bypass Firebase and API requests; serve cached app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER intercept non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. NEVER intercept Firebase Realtime, Firestore, Auth, Google APIs, or Backend APIs
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // 3. Navigation requests (HTML SPA routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        return cachedIndex || new Response('Offline - KM is currently disconnected from the network.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // 4. Static assets (JS, CSS, Images, Fonts) - Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
