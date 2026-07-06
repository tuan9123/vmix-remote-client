const CACHE_NAME = 'vmix-web-controller-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/style.css',
  '/js/vue.js',
  '/js/socket.io.js',
  '/app.js',
  '/components/Login.js',
  '/components/Dashboard.js',
  '/components/InputCard.js',
  '/components/ControlPanel.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First strategy to ensure updates are served instantly
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Skip API requests and Socket.io traffic
  if (url.pathname.includes('/api/') || url.pathname.includes('/socket.io/')) {
    return;
  }

  e.respondWith(
    fetch(e.request).then((response) => {
      // If valid network response, cache it and return
      if (response && response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
      }
      return response;
    }).catch(() => {
      // If network fails, fallback to Cache
      return caches.match(e.request).then((cachedResponse) => {
        return cachedResponse || caches.match('/index.html');
      });
    })
  );
});
