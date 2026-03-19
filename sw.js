/* ══════════════════════════════════════════════
   RUCHK DUVI — Service Worker
   Cache-first para uso offline completo
   ══════════════════════════════════════════════ */
const CACHE = 'ruchk-duvi-v1';
const ASSETS = [
  './ruck-duvi.html',
  './manifest.json',
  './icon.png',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

/* ── INSTALL: precachear archivos esenciales ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: limpiar caches viejas ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── FETCH: cache-first, network fallback ── */
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Solo cachear respuestas válidas y del mismo origen o fuentes conocidas
        if (
          response &&
          response.status === 200 &&
          (event.request.url.startsWith(self.location.origin) ||
           event.request.url.includes('fonts.googleapis.com') ||
           event.request.url.includes('fonts.gstatic.com'))
        ) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: devolver el HTML principal para navegación
        if (event.request.destination === 'document') {
          return caches.match('./ruck-duvi.html');
        }
      });
    })
  );
});
