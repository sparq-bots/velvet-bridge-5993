// Service worker: keeps the app shell and every chapter volume the reader has
// opened, so the site still works after this mirror goes down.
// BUILD and SHELL are filled in by scripts/build-site.js.
const BUILD = '202611261810-a34a3a';
const SHELL = ["./","index.html","styles.css","content/catalog.json?v=202611261810-a34a3a","js/app.js","js/book-orders.js","js/book-tradition.js","js/canon.js","js/config.js","js/follow.js","js/gunzip.js","js/i18n.js","js/numerals.js","js/share-file.js","js/verify.js","vendor/ed25519.js","vendor/fflate.js"];
const SHELL_CACHE = 'shell-' + BUILD;
const CONTENT_CACHE = 'content-v1';   // survives app updates

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('shell-') && k !== SHELL_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// The reader asks for its whole current Bible to be kept (every volume, the
// catalog and the index), so it works offline after one visit, even if this
// mirror is blocked later. Runs in the worker, so it works on the first visit.
self.addEventListener('message', e => {
  if (e.data?.type !== 'save' || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE), content = await caches.open(CONTENT_CACHE);
    for (const u of e.data.urls) {
      const url = new URL(u, self.registration.scope);
      if (url.origin !== location.origin) continue;
      const dat = url.pathname.endsWith('.dat');
      const c = dat ? content : shell;
      if (await c.match(url.href, { ignoreSearch: !dat })) continue;
      try {
        const res = await fetch(url.href);
        if (res.ok && !(res.headers.get('content-type') || '').includes('text/html')) await c.put(url.href, res);
      } catch { /* offline right now: try again next visit */ }
    }
    e.source?.postMessage({ type: 'saved', n: e.data.urls.length });
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // DBS ARC text and book names: keep what the reader has opened, for offline use.
  if (url.origin === 'https://arc.dbs.org' && /^\/api\/(bible-text|bible-books)\//.test(url.pathname)) {
    e.respondWith(caches.open(CONTENT_CACHE).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  const p = url.pathname;

  // Live list and health: always try the network first.
  if (p.endsWith('/livelist.json') || p.endsWith('/health.json')) {
    e.respondWith(caches.open(SHELL_CACHE).then(c => fetch(e.request)
      .then(res => { if (res.ok && !(res.headers.get('content-type') || '').includes('text/html')) c.put(e.request, res.clone()); return res; })
      .catch(async () => (await c.match(e.request)) || new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } }))));
    return;
  }
  // Scripture volumes: cache first; names are content hashes, so never stale.
  if (p.endsWith('.dat')) {
    e.respondWith(caches.open(CONTENT_CACHE).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  // Shell, catalog and indexes: stale-while-revalidate.
  e.respondWith(caches.open(SHELL_CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => {
      // Never keep an HTML page in place of a data file (a host's fallback page).
      const html = (res.headers.get('content-type') || '').includes('text/html');
      if (res.ok && (e.request.mode === 'navigate' || !html || /\.html?$|\/$/.test(p))) c.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
