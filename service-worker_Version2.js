// =========================================
// Service Worker بۆ PWA
// =========================================

const CACHE_NAME = 'pardakan-store-v1.0.0';
const API_CACHE = 'pardakan-api-v1.0.0';

// فایلەکانی cache کردن
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// دامەزراندنی Service Worker
self. addEventListener('install', event => {
  console.log('🚀 Service Worker دامەزرا');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 فایلەکان cache کران');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console. error('❌ هەڵە لە cache کردن:', error);
      })
  );
  
  // چالاککردنی خێرا
  self.skipWaiting();
});

// چالاککردنی Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker چالاککرا');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('🗑️ کەشی کۆن سڕایەوە:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // کۆنتڕۆڵکردنی هەموو کلاینتەکان
  return self.clients.claim();
});

// fetch - ستراتیژی Cache First بۆ static files
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // بۆ API داواکاریەکان - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request)
    );
    return;
  }
  
  // بۆ static files - Cache First
  event.respondWith(
    cacheFirst(request)
  );
});

// ستراتیژی Cache First
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    // cache کردنی وەڵامی نوێ
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('❌ هەڵە لە fetch:', error);
    
    // گەڕانەوەی پەڕەیەکی offline
    if (request.destination === 'document') {
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

// ستراتیژی Network First بۆ API
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const response = await fetch(request);
    
    // cache کردنی وەڵامی API
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('⚠️ Network نییە، لە cache وەردەگیرێت');
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// گوێگرتن بۆ پەیامەکان لە کلاینت
self.addEventListener('message', event => {
  if (event. data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Notification کلیک کردن
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('✨ Service Worker ئامادەیە!');