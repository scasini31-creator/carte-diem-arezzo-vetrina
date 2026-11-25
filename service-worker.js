/* CARTE DIEM AREZZO: cache selettiva delle sole risorse pubbliche statiche. */
const CACHE = 'carte-diem-static-v12';
const STATIC = [
  './shared-base.css?v=1',
  './shared-catalog-layout.css?v=1',
  './shared-overlay.css?v=1',
  './shared-mobile-nav.css?v=1',
  './shared-requests.js?v=1',
  './thumbs/index.js?v=1',
  './supabase-config.js?v=4',
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

/* Cache locale limitata alle immagini pubbliche della vetrina.
 * Non memorizza API, sessioni, richieste firmate o risposte opache. */
const PHOTO_PREFIX = 'carte-diem-public-photos-v1-';
const PHOTO_LIMIT = 160;
let photoEpoch = '';
let photoCleanup = Promise.resolve();
let photoWrites = Promise.resolve();
function publicPhoto(request, url) {
  return request.destination === 'image' &&
    url.origin === 'https://hheemlsfyxnhtigwewwv.supabase.co' &&
    /^\/storage\/v1\/object\/public\/(product-images|mancolista)\//.test(url.pathname) &&
    !url.search && !request.headers.has('authorization') && !request.headers.has('range');
}
async function photoCache() {
  const name = PHOTO_PREFIX + Math.floor(Date.now() / (3 * 86400000));
  if (photoEpoch !== name) {
    photoEpoch = name;
    photoCleanup = caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PHOTO_PREFIX) && k !== name).map(k => caches.delete(k)))).catch(() => {});
  }
  await photoCleanup;
  return caches.open(name);
}
async function servePhoto(request, url) {
  try {
    const cache = await photoCache();
    const key = new Request(url.href, {mode:'cors', credentials:'omit'});
    const hit = await cache.match(key);
    if (hit) return hit;
    let response;
    try { response = await fetch(key); } catch (_) { return fetch(request); }
    if (response.ok && response.type === 'cors' && /^image\//i.test(response.headers.get('content-type') || '')) {
      const copy = response.clone();
      photoWrites = photoWrites.catch(() => {}).then(async () => {
        await cache.put(key, copy);
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - PHOTO_LIMIT)).map(k => cache.delete(k)));
      });
      await photoWrites.catch(() => {});
    }
    return response;
  } catch (_) { return fetch(request); }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (publicPhoto(request, url)) {
    event.respondWith(servePhoto(request, url));
    return;
  }
  // Non intercettare API Supabase, CDN, pagine HTML o risorse amministrative.
  if (url.origin !== self.location.origin || !staticPaths.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, {ignoreSearch: true});
    // Mostra subito la risorsa in cache, aggiornandola in background per la prossima apertura.
    const refresh = fetch(request, {cache: 'no-cache'}).then(async response => {
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    });
    if (cached) {
      event.waitUntil(refresh.catch(() => {}));
      return cached;
    }
    return refresh;
  })());
});
