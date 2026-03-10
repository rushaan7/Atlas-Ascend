const CACHE_VERSION = 'geo-challenge-v2';
const STATIC_ASSETS = ['/offline.html', '/manifest.webmanifest', '/icon.svg'];

const isSameOrigin = (url) => url.origin === self.location.origin;

const isRuntimeCacheable = (request, url) => {
  if (request.method !== 'GET') {
    return false;
  }

  if (!isSameOrigin(url)) {
    return false;
  }

  if (url.pathname === '/sw.js') {
    return false;
  }

  if (url.pathname.startsWith('/_next/')) {
    return false;
  }

  if (url.pathname.startsWith('/api/')) {
    return false;
  }

  return true;
};

const cacheResponse = async (request, response) => {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response.clone());
  return response;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // In online mode, always ask network first for navigations so we do not
  // serve stale app shells while new JS chunks are being compiled/deployed.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (isSameOrigin(url) && url.pathname.startsWith('/api/countries')) {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  if (!isRuntimeCacheable(request, url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request)
          .then((response) => cacheResponse(request, response))
          .catch(() => undefined);
        return cached;
      }

      return fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(() => {
          return new Response('Offline', { status: 503 });
        });
    })
  );
});
