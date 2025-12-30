/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// 1. Cleanup old caches
cleanupOutdatedCaches();

// 2. Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// 3. Navigation Route for SPA (NetworkFirst for offline shell access)
registerRoute(new NavigationRoute(new NetworkFirst({
    cacheName: 'navigation-cache',
})));

// 4. Background Sync for Appointments (Mutations)
const bgSyncPlugin = new BackgroundSyncPlugin('appointment-queue', {
    maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

// Capture POST/PUT/PATCH requests to Supabase rest v1
registerRoute(
    ({ url, request }) =>
        url.pathname.startsWith('/rest/v1/') &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
    new NetworkOnly({
        plugins: [bgSyncPlugin],
    })
);

// 5. Cache Supabase GET Requests (Offline Readiness)
registerRoute(
    ({ url, request }) =>
        url.pathname.startsWith('/rest/v1/') &&
        request.method === 'GET',
    new NetworkFirst({
        cacheName: 'supabase-api-cache',
        networkTimeoutSeconds: 3, // Fallback to cache if network is slow
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 Hours
            }),
        ],
    })
);

// 6. Cache Google Fonts
registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new ExpirationPlugin({ maxEntries: 20 }),
        ],
    })
);

// 7. Push Notifications (Mission Alerts)
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Vector Operational Update';
    const options = {
        body: data.body || 'Mission parameters have changed.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: data.url || '/' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.openWindow(event.notification.data.url)
    );
});

// Skip waiting and claim clients
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
