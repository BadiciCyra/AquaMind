// AquaMind service worker: uygulamanın Android'de "yüklenebilir" olmasını sağlar.
// Uygulama kabuğunu önbelleğe alır; veriler (Firebase) her zaman ağdan gelir.
const CACHE = 'aquamind-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Sadece kendi sitemizdeki GET isteklerini ele al; Firebase vb. dokunma.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Ağ öncelikli: önce güncel sürümü dene, internet yoksa önbellekten ver.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});
