self.addEventListener("install", function(event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
    if (event.request.url.includes("https://www.dropbox.com/s/")) {
        event.respondWith(
            caches.open("catche8").then(function(cache) {
                return cache.match(event.request).then(function(response) {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request.clone()).then(function(response) {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(function(error) {
                    console.error("Error in fetch handler:", error);
                    throw error;
                });
            })
        );
    }
});
