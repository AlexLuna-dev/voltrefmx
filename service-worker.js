/* VoltRefMX — Service Worker
   Cache-first: una vez cacheado, funciona sin conexión.
   Solo se activa si el sitio se sirve por http(s) — en file:// el navegador
   ignora el registro y la app sigue funcionando igual, sin caché de SW. */

const CACHE_NAME = 'voltrefmx-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './tablero.html',
  './unamano.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first con fallback a red, y actualización silenciosa en segundo plano.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached); // sin red: lo que haya en caché

      return cached || fetchPromise;
    })
  );
});
