const CACHE = "yoga-streak-v8";
const ASSETS = ["./", "index.html", "styles-v3.css", "standing-poses-v5.js", "app-v8.js", "pose-tadasana-me.jpg", "pose-malasana-me.jpg", "pose-trikonasana-me.jpg", "pose-utkatasana-me.jpg", "pose-uttanasana-me-v2.jpg", "pose-padangusthasana-me-v2.jpg", "pose-downward-dog-me.jpg", "pose-prasarita-a-me.jpg", "pose-prasarita-b-me.jpg", "pose-prasarita-c-me.jpg", "pose-prasarita-d-me.jpg", "pose-parsvottanasana-me.jpg", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));

