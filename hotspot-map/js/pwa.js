// 主线程集成 - PWA 功能

class PWAManager {
  constructor() {
    this.db = new HotspotMapDB();
    this.syncManager = new DataSyncManager();
    this.isInitialized = false;
  }

  /**
   * 初始化 PWA
   */
  async init() {
    if (this.isInitialized) {
      console.log('[PWA] 已经初始化');
      return;
    }

    console.log('[PWA] 开始初始化...');
    
    try {
      // 1. 初始化数据库
      await this.db.init();
      console.log('[PWA] IndexedDB 初始化完成');

      // 2. 检查 Service Worker 状态
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log('[PWA] Service Worker 已注册:', registration.scope);
          
          // 测试通信
          try {
            await registration.active.postMessage({
              type: 'PING',
              payload: {}
            });
            console.log('[PWA] Service Worker 通信测试成功');
          } catch (error) {
            console.warn('[PWA] Service Worker 通信测试失败:', error);
          }
        } else {
          console.log('[PWA] Service Worker 未注册，尝试注册...');
          await this.registerServiceWorker();
        }
      } else {
        console.warn('[PWA] 当前浏览器不支持 Service Worker');
      }

      // 3. 加载用户配置
      await this.loadUserSettings();
      console.log('[PWA] 用户配置加载完成');

      // 4. 初始化数据同步
      await this.syncManager.init(this.db);
      console.log('[PWA] 数据同步管理器初始化完成');

      // 5. 注册消息监听
      this.registerMessageListener();

      this.isInitialized = true;
      console.log('[PWA] PWA 初始化完成 ✅');

    } catch (error) {
      console.error('[PWA] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册 Service Worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker 注册成功');
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker 注册失败:', error);
      throw error;
    }
  }

  /**
   * 加载用户配置
   */
  async loadUserSettings() {
    const enabledPlatforms = await this.db.getSetting('enabledPlatforms');
    const enabledTypes = await this.db.getSetting('enabledTypes');
    
    if (enabledPlatforms) {
      this.applyFilter('platform', enabledPlatforms.value);
    }
    
    if (enabledTypes) {
      this.applyFilter('type', enabledTypes.value);
    }
  }

  /**
   * 应用筛选
   */
  async applyFilter(type, value) {
    // 如果是平台筛选
    if (type === 'platform') {
      const platforms = Array.isArray(value) ? value : value.split(',');
      platforms.forEach(platform => {
        const checkbox = document.getElementById(`plat-${platform}`);
        if (checkbox) checkbox.checked = platform.includes(platform);
      });
    }
    
    // 如果是类型筛选
    if (type === 'type') {
      const types = Array.isArray(value) ? value : value.split(',');
      types.forEach(type => {
        const buttons = document.querySelectorAll('.quick-filter');
        buttons.forEach(btn => {
          if (btn.textContent.includes(type)) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      });
    }
  }

  /**
   * 注册消息监听
   */
  registerMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', async (event) => {
        const { type, payload } = event.data;
        
        console.log('[PWA] 收到消息:', type);

        switch (type) {
          case 'SW_READY':
            console.log('[PWA] Service Worker 已就绪');
            break;

          case 'SYNC_QUEUE':
            console.log('[PWA] 收到同步队列:', payload);
            await this.syncManager.processQueue(payload.queue);
            break;

          case 'SYNC_COMPLETE':
            console.log('[PWA] 同步完成');
            this.updateSyncUI(payload);
            break;

          case 'OFFLINE_STATUS':
            this.updateOfflineStatus(payload);
            break;

          default:
            console.warn('[PWA] 未知消息类型:', type);
        }
      });
    }
  }

  /**
   * 刷新数据
   */
  async refreshData() {
    console.log('[PWA] 刷新数据...');
    
    // 1. 添加到同步队列
    await this.syncManager.addToQueue('refresh', {});

    // 2. 通过 Service Worker 同步
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.active.postMessage({
          type: 'REFRESH_DATA',
          payload: {}
        });
        console.log('[PWA] 已发送刷新请求');
      }
    }
  }

  /**
   * 更新同步 UI
   */
  updateSyncUI(status) {
    const statusDiv = document.getElementById('refresh-status');
    if (!statusDiv) return;

    if (status.isSyncing) {
      statusDiv.textContent = '🔄 正在同步...';
      statusDiv.className = 'sync-status syncing';
    } else if (status.success) {
      statusDiv.textContent = '✅ 同步完成';
      statusDiv.className = 'sync-status success';
    } else if (status.error) {
      statusDiv.textContent = '❌ 同步失败';
      statusDiv.className = 'sync-status error';
    }
  }

  /**
   * 更新离线状态
   */
  updateOfflineStatus(status) {
    console.log('[PWA] 离线状态:', status);
    
    // 可以添加离线提示
    if (!status.isOnline) {
      const notification = document.createElement('div');
      notification.className = 'offline-notification';
      notification.textContent = '⚠️ 您当前处于离线模式';
      document.body.appendChild(notification);
      
      // 5 秒后自动消失
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.active.postMessage({
          type: 'GET_CACHE_SIZE',
          payload: {}
        });
        
        // 监听响应（一次性）
        return new Promise((resolve) => {
          const listener = (event) => {
            if (event.data.type === 'CACHE_SIZE') {
              resolve(event.data.payload.size);
              navigator.serviceWorker.removeEventListener('message', listener);
            }
          };
          
          navigator.serviceWorker.addEventListener('message', listener);
        });
      }
    }
    
    return 0;
  }

  /**
   * 清空缓存
   */
  async clearCache() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.active.postMessage({
          type: 'CLEAR_CACHE',
          payload: {}
        });
        console.log('[PWA] 已发送清空缓存请求');
      }
    }
  }
}

// 导出到全局
window.PWAManager = PWAManager;

console.log('✅ PWA 管理器已加载');
