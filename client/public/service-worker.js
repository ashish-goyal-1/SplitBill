/**
 * Service Worker for SplitBill PWA
 * 
 * Features:
 * - Caches static assets for offline access
 * - Network-first strategy for API calls
 * - Cache-first strategy for static resources
 * - Background sync for pending operations
 */

const CACHE_NAME = 'splitbill-v2';
const STATIC_CACHE = 'splitbill-static-v2';
const DYNAMIC_CACHE = 'splitbill-dynamic-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch((err) => console.log('[SW] Pre-cache failed:', err))
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API calls - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Static assets - Cache first, network fallback
    event.respondWith(cacheFirst(request));
});

/**
 * Network-first strategy
 * Try network, fallback to cache
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Cache successful GET responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

/**
 * Cache-first strategy
 * Try cache, fallback to network
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Refresh cache in background
        fetchAndCache(request);
        return cachedResponse;
    }

    return fetchAndCache(request);
}

/**
 * Fetch and cache helper
 */
async function fetchAndCache(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Fetch failed:', request.url);

        // Return offline page for navigation
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker loaded');
