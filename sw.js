/* ══════════════════════════════════════════════════
   RUCHK DUVI — Service Worker v5
   Repo: bazarduvi.github.io/RUCHK-DUVI/
   ══════════════════════════════════════════════════ */
const CACHE = 'ruchk-duvi-v5';
const BASE  = '/RUCHK-DUVI/';

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon.png',
  BASE + 'sw.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] No cacheado:', url, e.message))
        )
      )
    )
  );
  self.skipWaiting();
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Eliminando caché vieja:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  /* Navegación → network-first, fallback a index.html cacheado */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          return caches.match(BASE + 'index.html');
        })
    );
    return;
  }

  /* Assets → cache-first, network fallback */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200 &&
          (url.origin === self.location.origin ||
           url.hostname.includes('fonts.googleapis.com') ||
           url.hostname.includes('fonts.gstatic.com'))) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
