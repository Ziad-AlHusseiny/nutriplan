// NutriPlan's service worker (generated into dist/sw.js by prerender.mjs).
// The app pages, every script and font, and the small photos are precached
// on install, so the planner, the shopping list and cook mode work in a
// supermarket with no signal. Recipe pages and big photos are cached as
// they're visited.
//
// Pages: network first (fresh after a deploy), the cached copy when
// offline or when the network takes over 3 seconds, and for a page never
// visited, the app shell, which then renders it.
// Assets: cache first; their names are content-hashed, so they never go stale.

const VERSION = '__VERSION__';
const CACHE = `nutriplan-${VERSION}`;
const PRECACHE = ['__PRECACHE__'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('nutriplan-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const pageKey = (url) => url.pathname.replace(/\/index\.html$/, '').replace(/(.)\/+$/, '$1') || '/';
const shellFor = (key) => (key === '/ar' || key.startsWith('/ar/') ? '/ar' : '/');

// One bar of signal in a supermarket: don't wait forever for the network
// when a cached copy is there. After this long, show the cache (the network
// answer still refreshes it for next time).
const NETWORK_TIMEOUT = 3000;

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const key = pageKey(new URL(request.url));
  const cached = () => cache.match(key, { ignoreVary: true }).then((hit) => hit ?? cache.match(shellFor(key), { ignoreVary: true })).then((hit) => hit ?? cache.match('/', { ignoreVary: true }));
  const network = fetch(request).then((response) => {
    // Keep app pages only, and only as HTML: opening an image or the
    // manifest in a tab must never become an offline "page".
    const html = (response.headers.get('content-type') ?? '').includes('text/html');
    if (response.ok && html) cache.put(key, response.clone());
    return response;
  });
  const exact = await cache.match(key, { ignoreVary: true });
  if (!exact) {
    try {
      return await network;
    } catch {
      return (await cached()) ?? Response.error();
    }
  }
  const slow = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT));
  try {
    const first = await Promise.race([network, slow]);
    return first ?? exact;
  } catch {
    return exact;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).origin === self.location.origin) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(networkFirst(request));
  else event.respondWith(cacheFirst(request));
});
