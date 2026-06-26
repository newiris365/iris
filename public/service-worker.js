// IRIS 365 Service Worker Placeholder
// This file prevents 500 errors on localhost when browsers request a service worker registered by other local projects.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
