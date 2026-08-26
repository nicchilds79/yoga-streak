const CACHE = "yoga-streak-v5";
const ASSETS = ["./", "index.html", "styles.css", "standing-poses-v3.js", "app-v5.js", "pose-tadasana-me.jpg", "pose-malasana-me.jpg", "pose-trikonasana-me.jpg", "pose-utkatasana-me.jpg", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
