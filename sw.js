const CACHE_NAME = 'hsi-mct-v1-event';
const ASSETS_TO_CACHE = [
  './dist/css/core.css',
  './dist/css/header.css',
  './dist/css/reset.css',
  './dist/js/core.js',
  './dist/js/header.js',
  './dist/js/ui.js',
  './dist/fonts/Inter/InterVariable.woff2',
  './dist/fonts/Roboto/RobotoFlex.woff2',
  './dist/img/HSI-Background.webp',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './favicon.ico'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  // Clear all caches on activation to ensure fresh content
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch assets from network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache HTML files or API requests to ensure fresh content
        const url = new URL(event.request.url);
        const isHtmlRequest = event.request.url.endsWith('.html') || event.request.url.endsWith('/');
        const isApiRequest = url.pathname.includes('/api/') ||
                            url.hostname.includes('dwapi.hsicrane.com');
        
        if (isHtmlRequest || isApiRequest) {
          return response;
        }
        
        // Cache other successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});

