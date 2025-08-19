// This is a minimal service worker. Its purpose is to make the app installable (PWA).
// It does not perform any caching to avoid issues in the development environment.

self.addEventListener('install', (event) => {
  // An empty install handler is sufficient.
  // We call skipWaiting() to ensure the new service worker activates immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients as soon as the service worker activates.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This is a "pass-through" fetch handler. It doesn't do anything with the request.
  // The browser will handle it as it normally would, fetching from the network.
  // This is the safest strategy to avoid caching problems.
  return;
});
