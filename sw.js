const CACHE_NAME = 'simmco-rigging-v7'; // Bumped to v7 for dynamic CDN caching
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './SIMMCO%20Logo%202.jpg'
];

// Install Event: Cache local critical files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache v7');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); 
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache first, network fallback. Dynamically cache external CSS/Fonts!
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Cache hit - return the cached file
        if (response) {
          return response;
        }
        
        // 2. Not in cache - fetch from the network
        return fetch(event.request).then(networkResponse => {
            // If the network fetches Tailwind CSS or Google Fonts successfully, save a copy in the cache for offline use!
            if (event.request.url.startsWith('https://cdn.tailwindcss.com') || 
                event.request.url.includes('fonts.googleapis.com') || 
                event.request.url.includes('fonts.gstatic.com')) {
                
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
          // 3. Offline and not in cache - fallback to index for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
