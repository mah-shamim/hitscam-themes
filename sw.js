/* HitsCam service worker: অফলাইন-রেডি।
   - পেজ (navigate): network-first, ব্যর্থ হলে ক্যাশ, তারপর 404/index
   - একই ডোমেইনের CSS/JS/ছবি/ফন্ট: stale-while-revalidate
   - অন্য ডোমেইন (CDN ইত্যাদি) ছোঁয়া হয় না
   ক্যাশ ভার্সন বদলালে (VERSION) পুরোনো ক্যাশ মুছে যায়। */
const VERSION = 'hc-v1.6.0';
const CORE = ['index.html', 'shop.html', 'cart.html', 'checkout.html', '404.html', 'assets/css/style.css', 'assets/js/app.js', 'assets/js/data.js', 'assets/icons/icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); if (res.ok) caches.open(VERSION).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('404.html') || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
