// Salto Capibara: guarda el juego para que funcione sin conexión.
// Si cambias algún archivo, sube también este con un número de versión nuevo.
const VERSION = 'salto-capibara-2.0.0';
const CORE = [
  './',
  './index.html',
  './privacidad.html',
  './manifest.webmanifest',
  './fonts/BagelFatOne-latin.woff',
  './fonts/BricolageGrotesque-latin.woff',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: primero la red (para recibir actualizaciones) y, sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Resto de archivos: la copia guardada al instante y se actualiza en segundo plano.
  event.respondWith(
    caches.match(req, {ignoreSearch: true}).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
