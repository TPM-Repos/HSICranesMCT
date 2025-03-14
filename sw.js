const CACHE_NAME = 'hsi-mct-v3'; // Incremented cache version
const ASSETS_TO_CACHE = [
  './dist/fonts/Inter/InterVariable.woff2',
  './dist/fonts/Roboto/RobotoFlex.woff2',
  './dist/img/HSI-Background.webp',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './favicon.ico'
];

// List of files that should always be fetched from network
const NETWORK_FIRST_FILES = [
  'index.html',
  'details.html',
  'drive-apps.html',
  'history.html',
  'projects.html',
  'run.html',
  'dist/js/'
];

// Helper function to determine if a request should use network-first strategy
function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST_FILES.some(file => url.includes(file));
}

// Log the current cache state for debugging
function logCacheContents() {
  caches.open(CACHE_NAME).then(cache => {
    cache.keys().then(keys => {
      console.log(`[SW] Cache ${CACHE_NAME} contains ${keys.length} items`);
      keys.forEach(request => {
        console.log(`[SW] Cached: ${request.url}`);
      });
    });
  });
}

// Install service worker and cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Skip waiting - activating immediately');
        return self.skipWaiting();
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW] Found caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Log cache contents after activation
        return logCacheContents();
      })
  );
});

// Fetch assets from cache or network
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For debugging - log fetch requests for HTML and JS files
  if (url.includes('.html') || url.includes('.js')) {
    console.log(`[SW] Fetch request for: ${url}`);
  }

  // Use different strategies based on the file type
  if (shouldUseNetworkFirst(url)) {
    // Network-first strategy for HTML and JS files
    console.log(`[SW] Using network-first strategy for: ${url}`);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response since it can only be consumed once
          const responseToCache = response.clone();
          
          // Cache the updated file
          caches.open(CACHE_NAME).then(cache => {
            console.log(`[SW] Updating cache for: ${url}`);
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          console.log(`[SW] Network failed, falling back to cache for: ${url}`);
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for other assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then((response) => {
              // Don't cache responses that aren't successful
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response since it can only be consumed once
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
  }
});

// Add a message event listener for manual cache invalidation
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'clearCache') {
    console.log('[SW] Clearing cache by request');
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Cache cleared successfully');
        // Notify the client that the cache was cleared
        event.source.postMessage({ action: 'cacheCleared' });
      })
    );
  }
});

