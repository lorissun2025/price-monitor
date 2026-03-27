// IndexedDB 封装 - PWA 数据存储
// 支持热店数据、用户配置、离线队列

class IndexedDBWrapper {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * 打开数据库
   */
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] 数据库打开成功:', this.dbName);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * 创建对象存储
   */
  createObjectStores(db) {
    // 热点数据存储
    if (!db.objectStoreNames.contains('hotspots')) {
      const hotspotsStore = db.createObjectStore('hotspots', { keyPath: 'id' });
      hotspotsStore.createIndex('timestamp', 'timestamp', { unique: false });
      hotspotsStore.createIndex('platform', 'platform', { unique: false });
      hotspotsStore.createIndex('type', 'type', { unique: false });
      console.log('[IndexedDB] 创建 hotspots 存储成功');
    }

    // 用户配置存储
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' });
      console.log('[IndexedDB] 创建 settings 存储成功');
    }

    // 离线队列存储
    if (!db.objectStoreNames.contains('offlineQueue')) {
      const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
      queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      queueStore.createIndex('priority', 'priority', { unique: false });
      console.log('[IndexedDB] 创建 offlineQueue 存储成功');
    }

    // 同步状态存储
    if (!db.objectStoreNames.contains('syncStatus')) {
      db.createObjectStore('syncStatus', { keyPath: 'key' });
      console.log('[IndexedDB] 创建 syncStatus 存储成功');
    }
  }

  /**
   * 添加数据
   */
  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(data);

      request.onsuccess = () => {
        console.log(`[IndexedDB] 添加数据成功: ${storeName}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批量添加数据
   */
  async addAll(storeName, dataList) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const promises = [];

      for (const data of dataList) {
        const promise = new Promise((resolveItem, rejectItem) => {
          const request = store.add(data);

          request.onsuccess = () => resolveItem();
          request.onerror = () => rejectItem(request.error);
        });

        promises.push(promise);
      }

      Promise.all(promises)
        .then(() => {
          console.log(`[IndexedDB] 批量添加数据成功: ${storeName} (${dataList.length} 条)`);
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * 获取数据
   */
  async get(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有数据
   */
  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 通过索引查询
   */
  async getByIndex(storeName, indexName, value) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);

    return new Promise((resolve, reject) => {
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新数据
   */
  async update(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`[IndexedDB] 更新数据成功: ${storeName}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除数据
   */
  async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`[IndexedDB] 删除数据成功: ${storeName}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空存储
   */
  async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[IndexedDB] 清空存储成功: ${storeName}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 关闭数据库
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('[IndexedDB] 数据库已关闭:', this.dbName);
    }
  }
}

// 数据库操作类
class HotspotMapDB {
  constructor() {
    this.db = new IndexedDBWrapper('HotspotMapDB', 1);
  }

  /**
   * 初始化数据库
   */
  async init() {
    await this.db.open();
    console.log('[HotspotMapDB] 数据库初始化完成');
  }

  /**
   * 保存热点数据
   */
  async saveHotspots(hotspots) {
    // 先清空旧数据
    await this.db.clear('hotspots');

    // 批量添加新数据
    if (hotspots && hotspots.length > 0) {
      // 添加时间戳
      const dataWithTimestamp = hotspots.map(hotspot => ({
        ...hotspot,
        timestamp: Date.now()
      }));

      await this.db.addAll('hotspots', dataWithTimestamp);
    }

    // 更新同步状态
    await this.updateSyncStatus('hotspots', {
      lastSync: Date.now(),
      count: hotspots ? hotspots.length : 0
    });

    console.log('[HotspotMapDB] 保存热点数据完成:', hotspots ? hotspots.length : 0, '条');
  }

  /**
   * 获取热点数据
   */
  async getHotspots() {
    const hotspots = await this.db.getAll('hotspots');

    // 按时间戳排序，取最新的
    return hotspots.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 根据平台获取热点
   */
  async getHotspotsByPlatform(platform) {
    return await this.db.getByIndex('hotspots', 'platform', platform);
  }

  /**
   * 根据类型获取热点
   */
  async getHotspotsByType(type) {
    return await this.db.getByIndex('hotspots', 'type', type);
  }

  /**
   * 保存用户配置
   */
  async saveSetting(key, value) {
    await this.db.add('settings', {
      key,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 获取用户配置
   */
  async getSetting(key) {
    const setting = await this.db.get('settings', key);
    return setting ? setting.value : null;
  }

  /**
   * 添加离线队列项
   */
  async addToQueue(item) {
    await this.db.add('offlineQueue', {
      type: item.type || 'unknown',
      params: item.params || {},
      timestamp: Date.now(),
      priority: item.priority || 2
    });
  }

  /**
   * 获取离线队列（按优先级）
   */
  async getQueue() {
    const queue = await this.db.getAll('offlineQueue');
    return queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 清空离线队列
   */
  async clearQueue() {
    await this.db.clear('offlineQueue');
  }

  /**
   * 更新同步状态
   */
  async updateSyncStatus(key, value) {
    await this.db.update('settings', {
      key: `sync_${key}`,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(key) {
    const status = await this.db.get('settings', `sync_${key}`);
    return status ? status.value : null;
  }

  /**
   * 关闭数据库
   */
  close() {
    this.db.close();
  }
}

// 导出到全局
window.IndexedDBWrapper = IndexedDBWrapper;
window.HotspotMapDB = HotspotMapDB;

console.log('✅ IndexedDB 封装已加载');
