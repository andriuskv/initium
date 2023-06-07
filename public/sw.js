self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  if (event.request.url.startsWith("https://images.unsplash.com/") || event.request.url.startsWith("https://www.bing.com/th")) {
    event.respondWith(
      caches.open("wallpaper-image-cache").then(cache => {
        return cache.match(event.request, { ignoreVary: true }).then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            return response;
          });
        }).catch(error => {
          console.error("Error in fetch handler:", error);
          throw error;
        });
      })
    );
  }
});
