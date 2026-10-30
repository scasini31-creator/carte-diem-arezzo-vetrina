/* CARTE DIEM AREZZO: cache selettiva delle sole risorse pubbliche statiche. */
const CACHE = 'carte-diem-static-v1';
const STATIC = [
  './shared-base.css?v=1',
  './shared-catalog-layout.css?v=1',
  './shared-overlay.css?v=1',
  './shared-mobile-nav.css?v=1',
  './shared-requests.js?v=1',
  './supabase-config.js',
  './featured-home.js',
  './mancolista-home.js',
  './visual-published.js',
  './logo-ottimizzato.webp',
  './sfondo-home-definitivo.webp',
  './banner-pokemon.webp',
  './banner-tcg.webp',
  './banner-videogiochi.webp',
  './banner-accessori.webp',
  './icona-192.png',
  './icona-512.png'
];
const staticPaths = new Set(STATIC.map(path => new URL(path, self.registration.scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(STATIC.map(path => cache.add(path)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('carte-diem-static-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Mai intercettare Supabase, CDN, pagine HTML o risorse amministrative.
  if (url.origin !== self.location.origin || !staticPaths.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, {ignoreSearch: true});
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  })());
});
