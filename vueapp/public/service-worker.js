/*
 * Free Speech SAAC — Service Worker
 * Offline-first: cachea app shell + pictogramas locales en tiempo de ejecución.
 * Sin dependencias de build (no precache de hashes): todo es runtime caching.
 */
const CACHE = 'freespeech-v1';
const OFFLINE_URLS = ['/', '/index.html', '/favicon.ico', '/service-worker.js'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
		).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	const sameOrigin = url.origin === self.location.origin;
	const isArasaac = url.hostname === 'static.arasaac.org' || url.hostname === 'api.arasaac.org';
	if (!sameOrigin && !isArasaac) return;

	// Navegación: network-first con fallback a shell cacheado (SPA)
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((res) => {
					const clone = res.clone();
					caches.open(CACHE).then((c) => c.put('/index.html', clone));
					return res;
				})
				.catch(() => caches.match('/index.html'))
		);
		return;
	}

	// Estáticos + pictogramas: cache-first, guarda copia al acertar red
	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;
			return fetch(request).then((res) => {
				if (res && res.status === 200 && (sameOrigin || isArasaac)) {
					const clone = res.clone();
					caches.open(CACHE).then((c) => c.put(request, clone));
				}
				return res;
			});
		})
	);
});
