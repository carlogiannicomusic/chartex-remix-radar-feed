// Remix Radar PWA service worker.
// Cache the app shell so it opens offline; always try network-first for the
// feed so the data is fresh, falling back to cache when offline.
const SHELL = "rr-shell-v2";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Feed: network-first.
  if (url.pathname.endsWith("/feed.json")) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put("./feed.json", copy));
        return res;
      }).catch(() => caches.match("./feed.json"))
    );
    return;
  }
  // Shell: cache-first.
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
