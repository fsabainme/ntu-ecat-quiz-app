/* Cache-first service worker for the app shell + question data, so the app
   works fully offline after the first visit. Bump CACHE_VERSION whenever the
   app shell OR the data/*.data.js files change, to force a clean refresh. */
const CACHE_VERSION = "v9";
const CACHE_NAME = "ntu-ecat-cache-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/base.css",
  "./css/components.css",
  "./css/views.css",
  "./js/util.js",
  "./js/theme.js",
  "./js/store.js",
  "./js/data-index.js",
  "./js/router.js",
  "./js/app.js",
  "./js/views/blocks-renderer.js",
  "./js/views/dashboard.js",
  "./js/views/subject-list.js",
  "./js/views/topic-notes.js",
  "./js/views/book.js",
  "./js/views/practice-quiz.js",
  "./js/views/paper-list.js",
  "./js/views/exam.js",
  "./js/views/review.js",
  "./js/views/settings.js",
  "./data/volume1.data.js",
  "./data/volume2.data.js",
  "./data/front_matter.data.js",
  "./data/manifest.data.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/favicon.ico",
  "./assets/fonts/Inter-Variable.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
