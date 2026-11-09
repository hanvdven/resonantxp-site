// Service worker van de boodschappen-app. Op boodschappen.resonantxp.com geregistreerd met scope '/', op previews
// met scope '/boodschappen' (zodat hij de rest van resonantxp.com niet raakt).
// Netwerk eerst, cache als terugval: online krijg je altijd de nieuwste versie, offline (supermarkt zonder bereik)
// werkt de app gewoon door met wat er laatst geladen is. De lijstjes zelf staan in localStorage, niet hier.
const CACHE = 'boodschappen-v2';
const CORE = [self.registration.scope.endsWith('/boodschappen') ? '/boodschappen' : '/', '/boodschappen-ingredienten.json', '/boodschappen.webmanifest',
  '/icons/boodschappen-192.png', '/icons/boodschappen-512.png', '/icons/boodschappen-apple-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('boodschappen-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // Alleen eigen bestanden en de supabase-js-bibliotheek van de CDN; de import-API en Supabase zelf altijd live.
  const own = url.origin === location.origin && !url.pathname.startsWith('/api/');
  const lib = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('@supabase/supabase-js');
  if (!own && !lib) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match(CORE[0]) : Response.error()))));
});
