// HostelMate Service Worker with Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute, NavigationRoute } = workbox.routing;
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;

// Skip waiting and claim clients immediately
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Clean up old caches
cleanupOutdatedCaches();

// Force Inertia requests to use NetworkFirst so they are cached for offline use
// But NEVER fall back to the global HTML handler, to prevent the recursive layout bug
registerRoute(
    ({ request }) => request.headers.has('X-Inertia'),
    new NetworkFirst({
        cacheName: 'inertia-props',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }), // 1 day
        ],
        networkTimeoutSeconds: 3,
    })
);

// Cache Google/Bunny fonts
registerRoute(
    ({ url }) => url.origin === 'https://fonts.bunny.net' || url.origin === 'https://fonts.googleapis.com',
    new CacheFirst({
        cacheName: 'fonts-cache',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
        ],
    })
);

// Cache build assets (JS, CSS) - these have content hashes so can be cached forever
registerRoute(
    ({ url }) => url.pathname.startsWith('/build/assets/'),
    new CacheFirst({
        cacheName: 'build-assets',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
    })
);

// Cache static assets (icons, images)
registerRoute(
    ({ url }) => url.pathname.startsWith('/icons/') || url.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/),
    new CacheFirst({
        cacheName: 'static-assets',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
    })
);

// Navigation requests (HTML pages) - Network first, fall back to cache
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
        networkTimeoutSeconds: 3,
    })
);

// API requests - Network first with shorter timeout
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
        ],
        networkTimeoutSeconds: 5,
    })
);

// Catch-all for other requests
registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new StaleWhileRevalidate({
        cacheName: 'dynamic-assets',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 100 }),
        ],
    })
);

// Offline fallback
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/offline.html') || new Response(
                    '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                );
            })
        );
    }
});

console.log('[SW] HostelMate Service Worker loaded');
