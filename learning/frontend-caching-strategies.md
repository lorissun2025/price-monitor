# 前端缓存策略学习笔记

**学习时间：** 2026-03-23
**学习主题：** 前端缓存策略与最佳实践

---

## 一、缓存的重要性

### 为什么需要缓存？

**问题场景：**
```javascript
// 当前热点地图的实现 - 每次都重新请求数据
async function loadHotspots() {
  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();
  return hotspots;
}

// 每次刷新页面、切换筛选器都重新请求
// 浪费带宽、增加延迟、加重服务器负担
```

**缓存的收益：**
1. **减少网络请求** - 节省流量，降低延迟
2. **提升用户体验** - 内容秒开，无加载等待
3. **减轻服务器压力** - 减少数据库查询和 API 调用
4. **支持离线访问** - PWA 核心功能

---

## 二、缓存层级与策略

### 缓存金字塔（从快到慢）

```
          内存缓存
          ↓
      Service Worker
          ↓
        HTTP 缓存
          ↓
      CDN 缓存
          ↓
     数据库/源服务器
```

---

## 三、HTTP 缓存

### 1. 强缓存（Cache-Control）

**策略：强制浏览器使用本地缓存，不发送请求到服务器**

```javascript
// 服务端响应头设置
response.setHeader('Cache-Control', 'max-age=3600');  // 1 小时
// 或
response.setHeader('Cache-Control', 'public, max-age=86400');  // 24 小时，可被 CDN 缓存
```

**常用指令：**
```javascript
// max-age: 缓存有效时间（秒）
Cache-Control: max-age=3600  // 1 小时

// public: 可被 CDN 缓存
Cache-Control: public, max-age=86400

// private: 仅浏览器缓存，不被 CDN 缓存
Cache-Control: private, max-age=3600

// no-cache: 每次都请求服务器验证缓存
Cache-Control: no-cache

// no-store: 完全不缓存
Cache-Control: no-store

// must-revalidate: 过期后必须验证
Cache-Control: must-revalidate
```

**实施示例（Express）：**
```javascript
app.get('/api/hotspots', async (req, res) => {
  const hotspots = await db.getHotspots();

  // 设置缓存策略
  res.set('Cache-Control', 'public, max-age=300');  // 5 分钟

  // 添加 ETag（版本标识）
  const etag = crypto.createHash('md5')
    .update(JSON.stringify(hotspots))
    .digest('hex');
  res.set('ETag', etag);

  res.json(hotspots);
});
```

**适用场景：**
- ✅ 静态资源（CSS、JS、图片）
- ✅ API 数据（变化频率低）
- ✅ 第三方库（CDN）

**不适用：**
- ❌ 实时数据
- ❌ 用户特定数据
- ❌ 敏感数据

---

### 2. 协商缓存（ETag / Last-Modified）

**策略：浏览器发送请求到服务器，服务器验证缓存是否有效**

```javascript
// 服务端实现 ETag
app.get('/api/hotspots', async (req, res) => {
  const hotspots = await db.getHotspots();

  // 生成 ETag
  const etag = crypto.createHash('md5')
    .update(JSON.stringify(hotspots))
    .digest('hex');

  res.set('ETag', etag);

  // 检查客户端的 If-None-Match
  if (req.headers['if-none-match'] === etag) {
    // 缓存有效，返回 304 Not Modified
    return res.status(304).end();
  }

  res.json(hotspots);
});
```

**Last-Modified 实现：**
```javascript
app.get('/api/hotspots', async (req, res) => {
  const hotspots = await db.getHotspots();
  const lastModified = hotspots.reduce((max, h) =>
    Math.max(max, new Date(h.updatedAt).getTime()), 0
  );

  res.set('Last-Modified', new Date(lastModified).toUTCString());

  // 检查客户端的 If-Modified-Since
  const ifModifiedSince = new Date(req.headers['if-modified-since']).getTime();
  if (ifModifiedSince >= lastModified) {
    return res.status(304).end();
  }

  res.json(hotspots);
});
```

**对比：**
| 特性 | ETag | Last-Modified |
|------|------|---------------|
| 精度 | 高（精确到字节） | 低（精确到秒） |
| 性能 | 需要计算哈希 | 记录时间戳 |
| 适用 | 精确缓存 | 时间相关缓存 |

**推荐：** 优先使用 ETag，更精确可靠

---

## 四、浏览器缓存 API

### 1. Memory Cache（内存缓存）

**特点：**
- 最快的缓存
- 内存释放后缓存丢失
- 适合小数据、频繁访问

```javascript
// 简单实现
class MemoryCache {
  constructor(maxSize = 100, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;  // 60 秒
  }

  set(key, value) {
    // LRU 淘汰
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查过期
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问顺序（LRU）
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// 使用示例
const memoryCache = new MemoryCache(100, 60000);

async function getHotspots() {
  const cached = memoryCache.get('hotspots');
  if (cached) return cached;

  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();

  memoryCache.set('hotspots', hotspots);
  return hotspots;
}
```

---

### 2. LocalStorage / SessionStorage

**特点：**
- 持久化存储（LocalStorage）
- 会话存储（SessionStorage）
- 5-10MB 限制
- 同步 API

```javascript
class LocalStorageCache {
  constructor(prefix = 'cache_', ttl = 3600000) {
    this.prefix = prefix;
    this.ttl = ttl;  // 1 小时
  }

  set(key, value) {
    const item = {
      value,
      expires: Date.now() + this.ttl
    };

    localStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  get(key) {
    const item = localStorage.getItem(this.prefix + key);

    if (!item) return null;

    try {
      const data = JSON.parse(item);

      // 检查过期
      if (Date.now() > data.expires) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return data.value;
    } catch (error) {
      localStorage.removeItem(this.prefix + key);
      return null;
    }
  }

  delete(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// 使用示例
const storageCache = new LocalStorageCache('hotspot_', 3600000);

async function getHotspots() {
  const cached = storageCache.get('list');
  if (cached) return cached;

  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();

  storageCache.set('list', hotspots);
  return hotspots;
}
```

**适用场景：**
- ✅ 用户配置
- ✅ 离线数据
- ✅ 减少重复请求

**不适用：**
- ❌ 大数据（> 5MB）
- ❌ 敏感数据
- ❌ 频繁更新的数据

---

### 3. IndexedDB（大容量存储）

**特点：**
- 大容量（50MB - 数百 MB）
- 异步 API
- 支持事务
- 支持索引查询

```javascript
class IndexedDBCache {
  constructor(dbName = 'HotspotDB', storeName = 'cache', version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  async set(key, value, ttl = 3600000) {
    const item = {
      key,
      value,
      expires: Date.now() + ttl,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    return new Promise((resolve, reject) =></think><tool_call>write<arg_key>content</arg_key><arg_value># 前端缓存策略学习笔记

**学习时间：** 2026-03-23
**学习主题：** 前端缓存策略与最佳实践

---

## 一、缓存的重要性

### 为什么需要缓存？

**问题场景：**
```javascript
// 当前热点地图的实现 - 每次都重新请求数据
async function loadHotspots() {
  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();
  return hotspots;
}

// 每次刷新页面、切换筛选器都重新请求
// 浪费带宽、增加延迟、加重服务器负担
```

**缓存的收益：**
1. **减少网络请求** - 节省流量，降低延迟
2. **提升用户体验** - 内容秒开，无加载等待
3. **减轻服务器压力** - 减少数据库查询和 API 调用
4. **支持离线访问** - PWA 核心功能

---

## 二、缓存层级与策略

### 缓存金字塔（从快到慢）

```
          内存缓存
          ↓
      Service Worker
          ↓
        HTTP 缓存
          ↓
      CDN 缓存
          ↓
     数据库/源服务器
```

---

## 三、HTTP 缓存

### 1. 强缓存（Cache-Control）

**策略：强制浏览器使用本地缓存，不发送请求到服务器**

```javascript
// 服务端响应头设置
response.setHeader('Cache-Control', 'max-age=3600');  // 1 小时
// 或
response.setHeader('Cache-Control', 'public, max-age=86400');  // 24 小时，可被 CDN 缓存
```

**常用指令：**
```javascript
// max-age: 缓存有效时间（秒）
Cache-Control: max-age=3600  // 1 小时

// public: 可被 CDN 缓存
Cache-Control: public, max-age=86400

// private: 仅浏览器缓存，不被 CDN 缓存
Cache-Control: private, max-age=3600

// no-cache: 每次都请求服务器验证缓存
Cache-Control: no-cache

// no-store: 完全不缓存
Cache-Control: no-store

// must-revalidate: 过期后必须验证
Cache-Control: must-revalidate
```

**实施示例（Express）：**
```javascript
app.get('/api/hotspots', async (req, res) => {
  const hotspots = await db.getHotspots();

  // 设置缓存策略
  res.set('Cache-Control', 'public, max-age=300');  // 5 分钟

  // 添加 ETag（版本标识）
  const etag = crypto.createHash('md5')
    .update(JSON.stringify(hotspots))
    .digest('hex');
  res.set('ETag', etag);

  res.json(hotspots);
});
```

**适用场景：**
- ✅ 静态资源（CSS、JS、图片）
- ✅ API 数据（变化频率低）
- ✅ 第三方库（CDN）

**不适用：**
- ❌ 实时数据
- ❌ 用户特定数据
- ❌ 敏感数据

---

### 2. 协商缓存（ETag / Last-Modified）

**策略：浏览器发送请求到服务器，服务器验证缓存是否有效**

```javascript
// 服务端实现 ETag
app.get('/api/hotspots', async (req, res) => {
  const hotspots = await db.getHotspots();

  // 生成 ETag
  const etag = crypto.createHash('md5')
    .update(JSON.stringify(hotspots))
    .digest('hex');

  res.set('ETag', etag);

  // 检查客户端的 If-None-Match
  if (req.headers['if-none-match'] === etag) {
    // 缓存有效，返回 304 Not Modified
    return res.status(304).end();
  }

  res.json(hotspots);
});
```

**Last-Modified 实现：**
```javascript
app.get('/api/hotspots', async (req, res) => {
  const hotspots = await db.getHotspots();
  const lastModified = hotspots.reduce((max, h) =>
    Math.max(max, new Date(h.updatedAt).getTime()), 0
  );

  res.set('Last-Modified', new Date(lastModified).toUTCString());

  // 检查客户端的 If-Modified-Since
  const ifModifiedSince = new Date(req.headers['if-modified-since']).getTime();
  if (ifModifiedSince >= lastModified) {
    return res.status(304).end();
  }

  res.json(hotspots);
});
```

**对比：**
| 特性 | ETag | Last-Modified |
|------|------|---------------|
| 精度 | 高（精确到字节） | 低（精确到秒） |
| 性能 | 需要计算哈希 | 记录时间戳 |
| 适用 | 精确缓存 | 时间相关缓存 |

**推荐：** 优先使用 ETag，更精确可靠

---

## 四、浏览器缓存 API

### 1. Memory Cache（内存缓存）

**特点：**
- 最快的缓存
- 内存释放后缓存丢失
- 适合小数据、频繁访问

```javascript
// 简单实现
class MemoryCache {
  constructor(maxSize = 100, ttl = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;  // 60 秒
  }

  set(key, value) {
    // LRU 淘汰
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查过期
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问顺序（LRU）
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// 使用示例
const memoryCache = new MemoryCache(100, 60000);

async function getHotspots() {
  const cached = memoryCache.get('hotspots');
  if (cached) return cached;

  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();

  memoryCache.set('hotspots', hotspots);
  return hotspots;
}
```

---

### 2. LocalStorage / SessionStorage

**特点：**
- 持久化存储（LocalStorage）
- 会话存储（SessionStorage）
- 5-10MB 限制
- 同步 API

```javascript
class LocalStorageCache {
  constructor(prefix = 'cache_', ttl = 3600000) {
    this.prefix = prefix;
    this.ttl = ttl;  // 1 小时
  }

  set(key, value) {
    const item = {
      value,
      expires: Date.now() + this.ttl
    };

    localStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  get(key) {
    const item = localStorage.getItem(this.prefix + key);

    if (!item) return null;

    try {
      const data = JSON.parse(item);

      // 检查过期
      if (Date.now() > data.expires) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return data.value;
    } catch (error) {
      localStorage.removeItem(this.prefix + key);
      return null;
    }
  }

  delete(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// 使用示例
const storageCache = new LocalStorageCache('hotspot_', 3600000);

async function getHotspots() {
  const cached = storageCache.get('list');
  if (cached) return cached;

  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();

  storageCache.set('list', hotspots);
  return hotspots;
}
```

**适用场景：**
- ✅ 用户配置
- ✅ 离线数据
- ✅ 减少重复请求

**不适用：**
- ❌ 大数据（> 5MB）
- ❌ 敏感数据
- ❌ 频繁更新的数据

---

### 3. IndexedDB（大容量存储）

**特点：**
- 大容量（50MB - 数百 MB）
- 异步 API
- 支持事务
- 支持索引查询

```javascript
class IndexedDBCache {
  constructor(dbName = 'HotspotDB', storeName = 'cache', version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  async set(key, value, ttl = 3600000) {
    const item = {
      key,
      value,
      expires: Date.now() + ttl,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result;

        if (!item) {
          resolve(null);
          return;
        }

        // 检查过期
        if (Date.now() > item.expires) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(item.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpired() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expires');
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// 使用示例
const idbCache = new IndexedDBCache();

// 初始化
await idbCache.open();

// 使用
async function getHotspots() {
  const cached = await idbCache.get('hotspots');
  if (cached) return cached;

  const response = await fetch('/api/hotspots');
  const hotspots = await response.json();

  await idbCache.set('hotspots', hotspots, 3600000);  // 1 小时
  return hotspots;
}
```

**适用场景：**
- ✅ 大数据（> 5MB）
- ✅ 离线应用
- ✅ 复杂查询

**不适用：**
- ❌ 小数据（Memory Cache 更快）
- ❌ 简单场景（LocalStorage 更简单）

---

## 五、Service Worker 缓存（PWA 核心）

### Workbox 库推荐使用

**安装：**
```bash
npm install workbox-cli workbox-precaching workbox-routing workbox-strategies
```

**配置（sw.js）：**
```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

// 1. 预缓存静态资源
precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/css/styles.css', revision: '1' },
  { url: '/js/app.js', revision: '1' }
]);

// 2. 缓存 API 数据（NetworkFirst）
registerRoute(
  /\/api\/hotspots/,
  new NetworkFirst({
    cacheName: 'hotspots-api',
    networkTimeoutSeconds: 3,  // 3 秒超时后使用缓存
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          // 只缓存成功的响应
          return response.status === 200 ? response : null;
        }
      }
    ]
  })
);

// 3. 缓存静态资源（CacheFirst）
registerRoute(
  /\.(?:js|css|png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        }
      }
    ]
  })
);

// 4. 热点数据（StaleWhileRevalidate）
registerRoute(
  /\/api\/hotspots\/\d+/,
  new StaleWhileRevalidate({
    cacheName: 'hotspot-details',
    plugins: [
      {
        cachedResponseWillBeUsed: async ({ cacheName, request, cachedResponse }) => {
          // 自定义缓存过期逻辑
          const cachedDate = new Date(cachedResponse.headers.get('date'));
          const now = new Date();
          const age = (now - cachedDate) / 1000;  // 秒

          if (age > 3600) {  // 1 小时后刷新
            const freshResponse = await fetch(request);
            if (freshResponse.ok) {
              const cache = await caches.open(cacheName);
              await cache.put(request, freshResponse.clone());
              return freshResponse;
            }
          }

          return cachedResponse;
        }
      }
    ]
  })
);

// 5. 离线回退
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      {
        handlerDidError: async ({ request }) => {
          // 网络失败时返回离线页面
          return caches.match('/offline.html');
        }
      }
    ]
  })
);

registerRoute(navigationRoute);
```

**注册 Service Worker：**
```javascript
// 在主 JS 中注册
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker 注册成功:', registration);

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 提示用户刷新
            if (confirm('发现新版本，是否刷新？')) {
              window.location.reload();
            }
          }
        });
      });
    })
    .catch(error => {
      console.error('Service Worker 注册失败:', error);
    });
}
```

**缓存策略对比：**

| 策略 | 优先级 | 适用场景 | 示例 |
|------|--------|----------|------|
| CacheFirst | 缓存 | 静态资源 | CSS、JS、图片 |
| NetworkFirst | 网络 | 实时数据 | API 数据 |
| StaleWhileRevalidate | 并行 | 频繁访问 | 热点列表 |
| NetworkOnly | 网络 | 敏感数据 | 支付、登录 |
| CacheOnly | 缓存 | 离线资源 | 离线页面 |

---

## 六、Redis 缓存（服务端）

### 安装和配置

```bash
npm install redis ioredis
```

**实现：**
```javascript
const Redis = require('ioredis');

class RedisCache {
  constructor(options = {}) {
    this.client = new Redis({
      host: options.host || 'localhost',
      port: options.port || 6379,
      password: options.password,
      db: options.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.defaultTTL = options.defaultTTL || 3600;  // 1 小时
  }

  async set(key, value, ttl) {
    const serialized = JSON.stringify(value);
    const expireTime = ttl || this.defaultTTL;

    await this.client.setex(key, expireTime, serialized);
  }

  async get(key) {
    const serialized = await this.client.get(key);

    if (!serialized) return null;

    try {
      return JSON.parse(serialized);
    } catch (error) {
      return null;
    }
  }

  async delete(key) {
    await this.client.del(key);
  }

  async clear() {
    await this.client.flushdb();
  }

  async setWithTags(key, value, tags, ttl) {
    const serialized = JSON.stringify(value);

    // 保存数据
    await this.client.setex(key, ttl || this.defaultTTL, serialized);

    // 保存标签
    for (const tag of tags) {
      await this.client.sadd(`tag:${tag}`, key);
    }
  }

  async deleteByTag(tag) {
    const keys = await this.client.smembers(`tag:${tag}`);

    if (keys.length > 0) {
      await this.client.del(...keys);
      await this.client.del(`tag:${tag}`);
    }
  }

  async increment(key, delta = 1) {
    return await this.client.incrby(key, delta);
  }

  async getOrSet(key, fetcher, ttl) {
    // 先尝试从缓存获取
    const cached = await this.get(key);
    if (cached !== null) return cached;

    // 缓存未命中，执行 fetcher
    const value = await fetcher();

    // 保存到缓存
    await this.set(key, value, ttl);

    return value;
  }

  async close() {
    await this.client.quit();
  }
}

// 使用示例
const redisCache = new RedisCache({
  host: 'localhost',
  port: 6379,
  defaultTTL: 3600
});

// Express 中间件
app.get('/api/hotspots', async (req, res) => {
  try {
    const hotspots = await redisCache.getOrSet(
      'hotspots:list',
      async () => {
        return await db.getHotspots();
      },
      300  // 5 分钟
    );

    res.json(hotspots);
  } catch (error) {
    console.error('缓存错误:', error);
    // 降级到直接查询数据库
    const hotspots = await db.getHotspots();
    res.json(hotspots);
  }
});
```

**适用场景：**
- ✅ 多用户共享数据
- ✅ 高并发场景
- ✅ 复杂查询结果
- ✅ 需要快速失效

---

## 七、综合缓存策略

### 多层缓存架构

```javascript
class MultiLevelCache {
  constructor(options = {}) {
    this.memoryCache = options.memoryCache;  // L1: 内存
    this.storageCache = options.storageCache;  // L2: LocalStorage/IndexedDB
    this.redisCache = options.redisCache;  // L3: Redis
  }

  async get(key) {
    // L1: 内存缓存（最快）
    let value = this.memoryCache.get(key);
    if (value !== null) {
      console.log(`Cache hit: ${key} (Memory)`);
      return value;
    }

    // L2: 浏览器存储
    if (this.storageCache) {
      value = await this.storageCache.get(key);
      if (value !== null) {
        console.log(`Cache hit: ${key} (Storage)`);
        // 回填 L1
        this.memoryCache.set(key, value);
        return value;
      }
    }

    // L3: Redis（服务端）
    if (this.redisCache) {
      value = await this.redisCache.get(key);
      if (value !== null) {
        console.log(`Cache hit: ${key} (Redis)`);
        // 回填 L2 和 L1
        if (this.storageCache) {
          await this.storageCache.set(key, value);
        }
        this.memoryCache.set(key, value);
        return value;
      }
    }

    console.log(`Cache miss: ${key}`);
    return null;
  }

  async set(key, value, ttl) {
    // 同时写入所有层级
    this.memoryCache.set(key, value);

    if (this.storageCache) {
      await this.storageCache.set(key, value, ttl);
    }

    if (this.redisCache) {
      await this.redisCache.set(key, value, ttl);
    }
  }

  async getOrSet(key, fetcher, ttl) {
    // 先尝试获取
    const cached = await this.get(key);
    if (cached !== null) return cached;

    // 缓存未命中，执行 fetcher
    const value = await fetcher();

    // 保存到所有层级
    await this.set(key, value, ttl);

    return value;
  }
}

// 使用示例
const cache = new MultiLevelCache({
  memoryCache: new MemoryCache(100, 60000),  // 1 分钟
  storageCache: new LocalStorageCache('hotspot_', 3600000),  // 1 小时
  redisCache: new RedisCache({ defaultTTL: 3600 })  // 1 小时
});

async function getHotspots() {
  return await cache.getOrSet(
    'hotspots:list',
    async () => {
      return await fetch('/api/hotspots').then(res => res.json());
    },
    3600
  );
}
```

---

## 八、缓存失效策略

### 1. TTL（Time To Live）
```javascript
// 设置过期时间
cache.set(key, value, 3600);  // 1 小时后自动失效
```

### 2. 手动失效
```javascript
// 数据更新时主动清除缓存
async function updateHotspot(id, data) {
  await db.updateHotspot(id, data);

  // 清除相关缓存
  await redisCache.delete(`hotspots:list`);
  await redisCache.delete(`hotspot:${id}`);
  await redisCache.deleteByTag('hotspot_updated');
}
```

### 3. 事件驱动失效
```javascript
// 使用 Redis Pub/Sub 订阅数据变更
const subscriber = new Redis();

subscriber.subscribe('hotspot_updates', (message) => {
  const { type, id } = JSON.parse(message);

  if (type === 'update') {
    redisCache.delete(`hotspot:${id}`);
    redisCache.delete('hotspots:list');
  }
});
```

---

## 九、缓存最佳实践

### ✅ DO

1. **分层缓存** - 内存 → 存储 → 服务端
2. **合理设置 TTL** - 根据数据变化频率
3. **降级策略** - 缓存失败时正常响应
4. **监控指标** - 缓存命中率、响应时间
5. **缓存预热** - 启动时加载热点数据

### ❌ DON'T

1. **不要缓存敏感数据** - 个人信息、支付信息
2. **不要无限缓存** - 必须设置 TTL
3. **不要缓存大对象** - 拆分成小对象
4. **不要忽略缓存失效** - 数据更新时主动清除
5. **不要过度缓存** - 只缓存高频访问的数据

---

## 十、学习总结

**缓存层次：**
1. **内存缓存** - 最快，适合小数据、高频访问
2. **浏览器存储** - LocalStorage（5MB）、IndexedDB（大容量）
3. **HTTP 缓存** - Cache-Control、ETag
4. **Service Worker** - PWA 离线支持
5. **Redis** - 服务端共享缓存

**关键策略：**
- **强缓存** - 不发请求，直接使用
- **协商缓存** - 发请求验证，返回 304
- **分层缓存** - L1→L2→L3 逐级回填
- **失效策略** - TTL、手动清除、事件驱动

**预期效果：**
- 响应时间减少 60-80%
- 服务器压力降低 70-90%
- 离线可用性 100%
- 流量节省 50-80%

**下一步：**
1. 在热点地图项目中实施多层缓存
2. 添加 Service Worker 支持
3. 监控缓存命中率
4. 优化缓存 TTL 策略

---

**依依2号 - 2026-03-23**
**学习主题：前端缓存策略**
