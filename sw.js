const CACHE_NAME = 'heart-mci-v8';
const ASSETS = [
  '/Heart-mci/',
  '/Heart-mci/index.html',
  '/Heart-mci/manifest.json',
  '/Heart-mci/icon-192.png',
  '/Heart-mci/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.10/babel.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage({type: 'SW_UPDATED'}))))
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for HTML pages so updates are picked up immediately when online
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('/Heart-mci/index.html')))
    );
    return;
  }
  // Cache-first for static assets (icons, JS libs)
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp.ok && e.request.method === 'GET') {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match('/Heart-mci/index.html')))
  );
});
