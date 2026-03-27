// 缓存工具类 - 阶段 1 基础优化
// 支持：Memory Cache、LocalStorage、HTTP 缓存

/**
 * Memory Cache（内存缓存）
 * 最快的缓存，适合小数据、高频访问
 */
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

  has(key) {
    return this.cache.has(key) && Date.now() <= this.cache.get(key).expires;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    let count = 0;
    for (const item of this.cache.values()) {
      if (Date.now() <= item.expires) count++;
    }
    return count;
  }
}

/**
 * LocalStorage Cache（持久化缓存）
 * 适合用户配置、离线数据
 */
class LocalStorageCache {
  constructor(prefix = 'hotspot_cache_', ttl = 3600000) {
    this.prefix = prefix;
    this.ttl = ttl;  // 1 小时
  }

  set(key, value) {
    try {
      const item = {
        value,
        expires: Date.now() + this.ttl,
        timestamp: Date.now()
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(item));
      console.log(`[LocalStorage] 缓存已保存: ${key}`);
    } catch (error) {
      console.error('[LocalStorage] 保存失败:', error);
      // 可能是存储空间已满，清除过期缓存
      this.clearExpired();
    }
  }

  get(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);

      if (!item) return null;

      const data = JSON.parse(item);

      // 检查过期
      if (Date.now() > data.expires) {
        this.delete(key);
        return null;
      }

      console.log(`[LocalStorage] 缓存命中: ${key}`);
      return data.value;
    } catch (error) {
      console.error('[LocalStorage] 读取失败:', error);
      this.delete(key);
      return null;
    }
  }

  has(key) {
    const value = this.get(key);
    return value !== null;
  }

  delete(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      console.log(`[LocalStorage] 缓存已删除: ${key}`);
    } catch (error) {
      console.error('[LocalStorage] 删除失败:', error);
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));

      keys.forEach(key => localStorage.removeItem(key));
      console.log(`[LocalStorage] 清空缓存 (${keys.length} 个)`);
    } catch (error) {
      console.error('[LocalStorage] 清空失败:', error);
    }
  }

  clearExpired() {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));

      let cleared = 0;
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Date.now() > data.expires) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch (error) {
          localStorage.removeItem(key);
          cleared++;
        }
      });

      if (cleared > 0) {
        console.log(`[LocalStorage] 清除过期缓存 (${cleared} 个)`);
      }
    } catch (error) {
      console.error('[LocalStorage] 清除过期缓存失败:', error);
    }
  }

  size() {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));

      let count = 0;
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (Date.now() <= data.expires) count++;
        } catch (error) {}
      });

      return count;
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Popup Cache（Popup 内容缓存）
 * 避免重复创建 HTML
 */
class PopupCache {
  constructor() {
    this.cache = new Map();
    this.template = document.createElement('div');
    this.template.className = 'hotspot-popup';
  }

  get(hotspotId) {
    return this.cache.get(hotspotId);
  }

  set(hotspotId, content) {
    this.cache.set(hotspotId, content);
    // LRU：限制缓存大小
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(hotspotId) {
    return this.cache.has(hotspotId);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  /**
   * 生成 Popup 内容（带缓存）
   */
  generate(hotspot) {
    // 检查缓存
    if (this.has(hotspot.id)) {
      return this.get(hotspot.id);
    }

    // 生成新内容
    const content = this.createPopupContent(hotspot);

    // 缓存
    this.set(hotspot.id, content);

    console.log(`[PopupCache] 生成 Popup 内容: ${hotspot.id}`);
    return content;
  }

  /**
   * 创建 Popup 内容
   */
  createPopupContent(hotspot) {
    const div = this.template.cloneNode(true);

    // 类型图标
    const typeIcon = this.getTypeIcon(hotspot.type);
    const platformIcon = this.getPlatformIcon(hotspot.platform);

    div.innerHTML = `
      <div class="popup-header">
        <span class="popup-type-icon">${typeIcon}</span>
        <span class="popup-platform-icon">${platformIcon}</span>
      </div>
      <h3 class="popup-title">${this.escapeHtml(hotspot.title)}</h3>
      <p class="popup-description">${this.escapeHtml(hotspot.description || '')}</p>

      <div class="popup-meta">
        <div class="popup-meta-item">
          <span class="popup-icon">📍</span>
          <span class="popup-label">城市:</span>
          <span class="popup-value">${this.escapeHtml(hotspot.location.city)}</span>
        </div>
        <div class="popup-meta-item">
          <span class="popup-icon">🔥</span>
          <span class="popup-label">热度:</span>
          <span class="popup-value hotspot-heat-value">${hotspot.influenceScore.toFixed(1)}</span>
        </div>
        <div class="popup-meta-item">
          <span class="popup-icon">📱</span>
          <span class="popup-label">平台:</span>
          <span class="popup-value">${this.escapeHtml(hotspot.platform)}</span>
        </div>
        <div class="popup-meta-item">
          <span class="popup-icon">📝</span>
          <span class="popup-label">类型:</span>
          <span class="popup-value">${this.escapeHtml(hotspot.type)}</span>
        </div>
      </div>

      <div class="popup-tags">
        ${(hotspot.tags || []).map(tag => `<span class="popup-tag">${this.escapeHtml(tag)}</span>`).join('')}
      </div>

      <div class="popup-actions">
        <a href="${this.escapeHtml(hotspot.url)}" target="_blank" class="popup-button popup-button-primary">
          查看详情
        </a>
      </div>
    `;

    return div;
  }

  /**
   * 获取类型图标
   */
  getTypeIcon(type) {
    const icons = {
      'food': '🍜',
      'travel': '🏛️',
      'activity': '🎉',
      'acg': '🎮',
      'social': '💬'
    };
    return icons[type] || '📍';
  }

  /**
   * 获取平台图标
   */
  getPlatformIcon(platform) {
    const icons = {
      'xiaohongshu': '📕',
      'weibo': '📢',
      'douyin': '🎵',
      'bilibili': '📺'
    };
    return icons[platform] || '📱';
  }

  /**
   * HTML 转义（防止 XSS）
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Cache Manager（统一缓存管理）
 */
class CacheManager {
  constructor() {
    // 初始化各级缓存
    this.memoryCache = new MemoryCache(100, 60000);  // 100 项，60 秒
    this.storageCache = new LocalStorageCache('hotspot_', 3600000);  // 1 小时
    this.popupCache = new PopupCache();
  }

  /**
   * 获取热点数据（多层缓存）
   */
  async getHotspots() {
    const cacheKey = 'hotspots:list';

    // L1: Memory Cache（最快）
    let hotspots = this.memoryCache.get(cacheKey);
    if (hotspots !== null) {
      console.log('[CacheManager] Memory Cache 命中');
      return hotspots;
    }

    // L2: LocalStorage（持久化）
    hotspots = this.storageCache.get(cacheKey);
    if (hotspots !== null) {
      console.log('[CacheManager] LocalStorage Cache 命中');
      // 回填 Memory Cache
      this.memoryCache.set(cacheKey, hotspots);
      return hotspots;
    }

    // L3: API 请求
    console.log('[CacheManager] 缓存未命中，请求 API');
    return null;  // 需要从 API 获取
  }

  /**
   * 设置热点数据
   */
  setHotspots(hotspots) {
    const cacheKey = 'hotspots:list';

    // 保存到所有层级
    this.memoryCache.set(cacheKey, hotspots);
    this.storageCache.set(cacheKey, hotspots);

    console.log('[CacheManager] 热点数据已缓存');
  }

  /**
   * 获取 Popup 内容
   */
  getPopupContent(hotspot) {
    return this.popupCache.generate(hotspot);
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    this.memoryCache.clear();
    this.storageCache.clear();
    this.popupCache.clear();
    console.log('[CacheManager] 所有缓存已清空');
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      memory: this.memoryCache.size(),
      storage: this.storageCache.size(),
      popup: this.popupCache.size()
    };
  }
}

// 创建全局缓存管理器
const cacheManager = new CacheManager();

// 导出到全局
window.cacheManager = cacheManager;
window.MemoryCache = MemoryCache;
window.LocalStorageCache = LocalStorageCache;
window.PopupCache = PopupCache;
window.CacheManager = CacheManager;

console.log('✅ 缓存工具已加载');
console.log('[Cache] 统计:', cacheManager.getStats());
