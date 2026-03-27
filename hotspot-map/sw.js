// Service Worker - PWA 核心（修复版）
// 修复 importScripts 未定义错误

// Service Worker 文件不能使用 importScripts
// 只能使用 importScripts() 方法或者不导入其他脚本
// 这里直接实现所有功能，不依赖其他脚本

const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const API_CACHE_NAME = `api-${CACHE_VERSION}`;

// 静态资源列表
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/utils/logger.js',
  '/js/utils/cache.js',
  '/js/utils/influence.js',
  '/js/utils/dedup.js',
  '/js/utils/geolocation.js',
  '/js/utils/geo.js',
  '/js/components/map.js',
  '/js/components/popup.js',
  '/js/components/legend.js',
  '/js/components/distance-filter.js',
  '/js/components/location.js',
  '/js/components/filter.js',
  '/js/components/stats.js',
  '/js/data/hotspots.js',
  '/js/data/api-fallback.js',
  '/js/app.js'
];

// Service Worker 安装
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');

  // 预缓存静态资源
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] 静态资源缓存已创建');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url)));
    }).then(() => {
      console.log('[Service Worker] 静态资源预缓存完成');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[Service Worker] 预缓存失败:', error);
    })
  );
});

// Service Worker 激活
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('static-') || cacheName.startsWith('api-');
          })
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('[Service Worker] 旧缓存已删除');
      console.log(`[Service Worker] 保留缓存: ${STATIC_CACHE_NAME}, ${API_CACHE_NAME}`);
      return self.clients.claim();
    })
  );
});

// Fetch 处理（自定义）
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  console.log(`[Service Worker] 处理请求: ${url}`);

  // 静态资源：CacheFirst
  if (isStaticResource(url)) {
    event.respondWith(handleStaticResource(request));
    return;
  }

  // API 请求：NetworkFirst
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 默认：NetworkFirst
  event.respondWith(handleDefaultRequest(request));
});

// 判断是否是静态资源
function isStaticResource(url) {
  return STATIC_ASSETS.some(asset => url.endsWith(asset)) ||
         url.match(/\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/);
}

// 判断是否是 API 请求
function isApiRequest(url) {
  return url.includes('/api/');
}

// 处理静态资源请求
async function handleStaticResource(request) {
  console.log(`[Service Worker] CacheFirst: ${request.url}`);

  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse && cachedResponse.ok) {
      console.log(`[Service Worker] 静态资源缓存命中: ${request.url}`);
      return cachedResponse;
    }

    console.log(`[Service Worker] 静态资源缓存未命中，从网络获取: ${request.url}`);

    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      console.log(`[Service Worker] 静态资源已缓存: ${request.url}`);
      return networkResponse;
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] 静态资源处理失败:', error);
    return new Response('Error', { status: 500 });
  }
}

// 处理 API 请求
async function handleApiRequest(request) {
  console.log(`[Service Worker] NetworkFirst: ${request.url}`);

  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000);
    });

    const response = await Promise.race([networkPromise, timeoutPromise]);

    if (response && response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, response.clone());
      console.log(`[Service Worker] API 响应已缓存: ${request.url}`);
      return response;
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] 网络请求失败，尝试缓存:', error.message);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] 使用缓存响应');
      return cachedResponse;
    }

    console.error('[Service Worker] 缓存也未命中');
    return new Response(JSON.stringify({
      error: 'offline',
      message: '网络不可用且无缓存数据',
      cached: false
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// 处理默认请求
async function handleDefaultRequest(request) {
  console.log(`[Service Worker] NetworkFirst (默认): ${request.url}`);

  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] 默认请求处理失败:', error);
    return new Response('Error', { status: 500 });
  }
}

// 消息监听（来自主线程）
self.addEventListener('message', (event) => {
  console.log('[Service Worker] 收到消息:', event.data);

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[Service Worker] 跳过等待');
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'CLEAR_API_CACHE':
      clearApiCache().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;

    case 'PING':
      console.log('[Service Worker] PONG');
      event.ports[0].postMessage({ type: 'PONG', payload: {} });
      break;

    case 'REFRESH_DATA':
      console.log('[Service Worker] 刷新数据请求');
      event.ports[0].postMessage({ type: 'REFRESH_COMPLETE', payload: {} });
      break;

    default:
      console.warn('[Service Worker] 未知消息类型:', type);
  }
});

// 清空所有缓存
async function clearAllCaches() {
  console.log('[Service Worker] 清空所有缓存');

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );

  console.log(`[Service Worker] 已清空 ${cacheNames.length} 个缓存`);
}

// 清空 API 缓存
async function clearApiCache() {
  console.log('[Service Worker] 清空 API 缓存');

  try {
    const cache = await caches.open(API_CACHE_NAME);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));

    console.log(`[Service Worker] 已清空 ${keys.length} 个 API 缓存条目`);
  } catch (error) {
    console.error('[Service Worker] 清空 API 缓存失败:', error);
  }
}

// 获取缓存大小
async function getCacheSize() {
  let totalSize = 0;

  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

console.log('✅ Service Worker 已加载');
