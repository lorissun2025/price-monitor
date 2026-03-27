// 主应用 - 集成 PWA 功能（完整版）
// 包含所有必要的函数和类定义

// ==================== 工具函数 ====================

/**
 * 创建图标
 */
function createIcon(platform) {
  const icons = {
    xiaohongshu: L.divIcon({
      className: 'custom-div-icon xiaohongshu-icon',
      html: '<div style="background: linear-gradient(135deg, #ff2442 0%, #ff7b3f 100%); font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">📕</div>'
    }),
    weibo: L.divIcon({
      className: 'custom-div-icon weibo-icon',
      html: '<div style="background: linear-gradient(135deg, #e6162d 0%, #fa5252 100%); font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">📟</div>'
    }),
    douyin: L.divIcon({
      className: 'custom-div-icon douyin-icon',
      html: '<div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">🎵</div>'
    }),
    bilibili: L.divIcon({
      className: 'custom-div-icon bilibili-icon',
      html: '<div style="background: linear-gradient(135deg, #fb7299 0%, #ff85a2 100%); font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white;">📺️</div>'
    })
  };

  return icons[platform] || icons.xiaohongshu;
}

/**
 * 获取热点类型标签
 */
function getHotspotTypeLabel(type) {
  const labels = {
    food: '美食',
    tourism: '旅游',
    event: '活动',
    acg: 'ACG',
    social: '社交'
  };

  return labels[type] || '其他';
}

/**
 * 获取平台名称
 */
function getPlatformName(platform) {
  const names = {
    xiaohongshu: '小红书',
    weibo: '微博',
    douyin: '抖音',
    bilibili: 'B站'
  };

  return names[platform] || platform;
}

/**
 * 获取热点类型 class
 */
function getHotspotTypeClass(type) {
  const classes = {
    food: 'hotspot-food',
    tourism: 'hotspot-tourism',
    event: 'hotspot-event',
    acg: 'hotspot-acg',
    social: 'hotspot-social'
  };

  return classes[type] || 'hotspot-other';
}

/**
 * 获取影响力等级
 */
function getInfluenceLevel(score) {
  if (score >= 100) return 'S';
  if (score >= 50) return 'A';
  if (score >= 20) return 'B';
  if (score >= 10) return 'C';
  return 'D';
}

/**
 * 获取影响力标签
 */
function getInfluenceLabel(level) {
  const labels = {
    'S': '🔥 超高',
    'A': '⭐ 很高',
    'B': '👍 较高',
    'C': '💪 中等',
    'D': '💪 基础'
  };

  return labels[level] || level;
}

// ==================== 应用类 ====================

class HotspotMapApp {
  constructor() {
    this.map = null;
    this.allHotspots = [];
    this.currentHotspots = [];
    this.hotspotLayers = [];
    this.userLocation = null;
    this.isInitialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    console.log('[App] 开始初始化...');

    try {
      // 1. 初始化地图
      this.initMap();
      console.log('[App] 地图初始化完成');

      // 2. 初始化地理位置
      if (typeof GeoLocation !== 'undefined') {
        GeoLocation.init(this.map);
        console.log('[App] 地理位置初始化完成');
      }

      // 3. 加载数据
      await this.loadData();
      console.log('[App] 数据加载完成');

      // 4. 初始化筛选器
      this.initFilter(this.currentHotspots);
      console.log('[App] 筛选器初始化完成');

      // 5. 渲染热点
      this.renderHotspots(this.currentHotspots);
      console.log('[App] 热点渲染完成');

      // 6. 更新统计
      this.updateStats();
      console.log('[App] 统计更新完成');

      // 7. 添加图例
      this.addLegend();
      console.log('[App] 图例添加完成');

      // 8. 调整地图视野
      this.fitBoundsToHotspots(this.currentHotspots);
      console.log('[App] 地图视野调整完成');

      this.isInitialized = true;
      console.log('[App] 应用初始化完成 ✅');

    } catch (error) {
      console.error('[App] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载数据（简化版，不依赖 PWA）
   */
  async loadData() {
    const startTime = Date.now();
    console.log('[App] 开始加载数据...');

    try {
      // 直接使用模拟数据
      this.allHotspots = window.mockHotspotsData || [];

      if (this.allHotspots.length === 0) {
        console.warn('[App] 没有热点数据');
        return;
      }

      // 计算影响力等级
      this.allHotspots.forEach(hotspot => {
        if (typeof hotspot.influenceScore === 'number') {
          hotspot.influenceLevel = getInfluenceLevel(hotspot.influenceScore);
        } else {
          hotspot.influenceLevel = 'D';
        }
      });

      // 按影响力评分排序（从高到低）
      this.allHotspots.sort((a, b) => {
        const scoreA = a.influenceScore || 0;
        const scoreB = b.influenceScore || 0;
        return scoreB - scoreA;
      });

      // 只保留 Top 30 个热点
      this.allHotspots = this.allHotspots.slice(0, 30);

      const elapsed = Date.now() - startTime;
      console.log(`[App] 数据加载完成 (${this.allHotspots.length} 个热点, ${elapsed}ms)`);

      this.currentHotspots = this.allHotspots;

    } catch (error) {
      console.error('[App] 加载数据失败:', error);
      throw error;
    }
  }

  /**
   * 初始化地图
   */
  initMap() {
    // 初始化地图
    const mapOptions = {
      center: [35.8617, 104.1954],
      zoom: 4,
      maxBounds: [[85, 10], [125, 55]],
      zoomControl: true
    };

    this.map = L.map('map', mapOptions);
    console.log('[App] 地图已初始化');
  }

  /**
   * 应用筛选
   */
  applyFilter(hotspots, filter) {
    let filtered = [...hotspots];

    // 平台筛选
    if (filter.platforms && filter.platforms.length > 0) {
      filtered = filtered.filter(h => filter.platforms.includes(h.platform));
    }

    // 类型筛选
    if (filter.types && filter.types.length > 0) {
      filtered = filtered.filter(h => filter.types.includes(h.type));
    }

    // 城市筛选
    if (filter.city) {
      filtered = filtered.filter(h => h.location.city === filter.city);
    }

    // 搜索
    if (filter.search) {
      const queryLower = filter.search.toLowerCase();
      filtered = filtered.filter(h =>
        (h.title && h.title.toLowerCase().includes(queryLower)) ||
        (h.location && h.location.city && h.location.city.toLowerCase().includes(queryLower))
      );
    }

    return filtered;
  }

  /**
   * 渲染热点
   */
  renderHotspots(hotspots) {
    // 清除旧的图层
    this.clearHotspots();

    // 创建标记
    hotspots.forEach(hotspot => {
      const icon = createIcon(hotspot.platform);
      const marker = L.marker([hotspot.lat, hotspot.lng], { icon });

      // 简单 Popup
      const popupContent = `
        <div style="padding: 8px;">
          <strong>${hotspot.title || '未命名'}</strong><br>
          <span style="color: #666;">${hotspot.platform || ''}</span><br>
          <span style="color: #666;">${hotspot.location?.city || ''}</span><br>
          <span style="color: #666;">影响力: ${(hotspot.influenceScore || 0).toFixed(2)}</span>
        </div>
      `;

      marker.bindPopup(popupContent);

      // 添加到图层
      this.map.addLayer(marker);
      this.hotspotLayers.push(marker);
    });

    console.log(`[App] 已渲染 ${hotspots.length} 个热点`);
  }

  /**
   * 清除热点
   */
  clearHotspots() {
    if (this.hotspotLayers.length > 0) {
      this.hotspotLayers.forEach(layer => this.map.removeLayer(layer));
      this.hotspotLayers = [];
    }
  }

  /**
   * 刷新数据
   */
  async refreshData() {
    const startTime = Date.now();
    console.log('[App] 刷新数据...');

    try {
      const statusDiv = document.getElementById('refresh-status');
      if (statusDiv) {
        statusDiv.textContent = '🔄 刷新中...';
        statusDiv.className = 'refresh-status syncing';
      }

      // 重新加载数据
      await this.loadData();
      this.applyFilter(this.allHotspots, this.getCurrentFilter());
      this.renderHotspots(this.currentHotspots);
      this.updateStats();

      if (statusDiv) {
        const elapsed = Date.now() - startTime;
        statusDiv.textContent = `✅ 刷新完成 (${elapsed}ms)`;
        statusDiv.className = 'refresh-status success';
      }
    } catch (error) {
      console.error('[App] 刷新数据失败:', error);

      const statusDiv = document.getElementById('refresh-status');
      if (statusDiv) {
        statusDiv.textContent = '❌ 刷新失败';
        statusDiv.className = 'refresh-status error';
      }
    }
  }

  /**
   * 获取当前筛选条件
   */
  getCurrentFilter() {
    return {
      platforms: this.getActivePlatforms(),
      types: this.getActiveTypes()
    };
  }

  /**
   * 获取激活的平台
   */
  getActivePlatforms() {
    const platforms = [];

    if (document.getElementById('plat-xiaohongshu')?.checked) {
      platforms.push('xiaohongshu');
    }
    if (document.getElementById('plat-weibo')?.checked) {
      platforms.push('weibo');
    }
    if (document.getElementById('plat-douyin')?.checked) {
      platforms.push('douyin');
    }
    if (document.getElementById('plat-bilibili')?.checked) {
      platforms.push('bilibili');
    }

    return platforms;
  }

  /**
   * 获取激活的类型
   */
  getActiveTypes() {
    const activeButton = document.querySelector('.quick-filter.active');
    if (!activeButton) return [];

    const typeMap = {
      '全部热点': 'all',
      '美食探店': 'food',
      '旅游打卡': 'tourism',
      '漫展活动': 'event',
      '社交热点': 'social'
    };

    const type = typeMap[activeButton.textContent];
    return type === 'all' ? [] : [type];
  }

  /**
   * 其他方法
   */
  initFilter(hotspots) {
    this.currentHotspots = hotspots;
  }

  updateStats() {
    const statsDiv = document.getElementById('stat-total');
    if (statsDiv) {
      statsDiv.textContent = this.currentHotspots.length;
    }

    // 更新各平台统计
    this.updatePlatformStats();
  }

  updatePlatformStats() {
    const platformCounts = {
      xiaohongshu: 0,
      weibo: 0,
      douyin: 0,
      bilibili: 0
    };

    this.currentHotspots.forEach(hotspot => {
      if (platformCounts[hotspot.platform] !== undefined) {
        platformCounts[hotspot.platform]++;
      }
    });

    const xiaohongshuDiv = document.getElementById('stat-xiaohongshu');
    const weiboDiv = document.getElementById('stat-weibo');
    const douyinDiv = document.getElementById('stat-douyin');
    const bilibiliDiv = document.getElementById('stat-bilibili');

    if (xiaohongshuDiv) xiaohongshuDiv.textContent = platformCounts.xiaohongshu;
    if (weiboDiv) weiboDiv.textContent = platformCounts.weibo;
    if (douyinDiv) douyinDiv.textContent = platformCounts.douyin;
    if (bilibiliDiv) bilibiliDiv.textContent = platformCounts.bilibili;
  }

  addLegend() {
    const legend = L.control({ position: 'topright' });
    legend.addTo(this.map);
  }

  fitBoundsToHotspots(hotspots) {
    if (hotspots.length === 0) return;

    const bounds = L.latLngBounds();
    hotspots.forEach(h => {
      bounds.extend([h.lat, h.lng]);
    });

    this.map.fitBounds(bounds, { padding: [20, 20, 20, 20] });
  }

  /**
   * 地图类型切换
   */
  switchMap(type) {
    if (type === 'china') {
      this.map.setView([36.0, 106.0], 4);
    } else if (type === 'world') {
      this.map.setView([20, 0], 2);
    }
  }

  /**
   * 搜索热点
   */
  async searchHotspots(query) {
    const statusDiv = document.getElementById('search-status');

    if (statusDiv) {
      statusDiv.textContent = '🔄 搜索中...';
    }

    try {
      const filtered = this.allHotspots.filter(h =>
        (h.title && h.title.toLowerCase().includes(query.toLowerCase())) ||
        (h.location && h.location.city && h.location.city.toLowerCase().includes(query.toLowerCase()))
      );

      this.currentHotspots = filtered;
      this.renderHotspots(filtered);
      this.updateStats();

      if (statusDiv) {
        statusDiv.textContent = `✅ 找到 ${filtered.length} 个热点`;
      }
    } catch (error) {
      console.error('[App] 搜索失败:', error);

      if (statusDiv) {
        statusDiv.textContent = '❌ 搜索失败';
      statusDiv.className = 'search-status error';
      }
    }
  }

  /**
   * 快捷筛选
   */
  quickFilter(type) {
    const buttons = document.querySelectorAll('.quick-filter');
    buttons.forEach(btn => btn.classList.remove('active'));

    if (type === 'all') {
      this.currentHotspots = this.allHotspots;
    } else {
      this.currentHotspots = this.allHotspots.filter(h => h.type === type);
    }

    // 更新按钮状态
    const targetButton = Array.from(buttons).find(btn => {
      if (type === 'all') return btn.textContent === '全部热点';
      if (type === 'food') return btn.textContent === '美食探店';
      if (type === 'tourism') return btn.textContent === '旅游打卡';
      if (type === 'event') return btn.textContent === '漫展活动';
      if (type === 'social') return btn.textContent === '社交热点';
      return false;
    });

    if (targetButton) {
      targetButton.classList.add('active');
    }

    this.renderHotspots(this.currentHotspots);
    this.updateStats();
  }

  /**
   * 平台筛选
   */
  filterByPlatform(platform, checked) {
    const platforms = this.getActivePlatforms();
    this.currentHotspots = this.allHotspots.filter(h =>
      platforms.length === 0 || platforms.includes(h.platform)
    );

    this.renderHotspots(this.currentHotspots);
    this.updateStats();
    this.updatePlatformStats();
  }

  /**
   * 定位用户
   */
  async locateUser() {
    const statusElement = document.getElementById('location-status');

    if (!navigator.geolocation) {
      if (statusElement) {
        statusElement.textContent = '❌ 您的浏览器不支持地理位置';
      }
      return;
    }

    if (statusElement) {
      statusElement.textContent = '📍 正在定位...';
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => reject(err),
          { timeout: 10000, enableHighAccuracy: false }
        );
      });

      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // 触发自定义事件
      const event = new CustomEvent('userPositionFound', {
        detail: this.userLocation
      });
      window.dispatchEvent(event);

      if (statusElement) {
        statusElement.textContent = `✅ 定位成功：${this.userLocation.lat.toFixed(4)}, ${this.userLocation.lng.toFixed(4)}`;
      }

    } catch (error) {
      console.error('[App] 定位失败:', error);

      if (statusElement) {
        statusElement.textContent = `❌ 定位失败：${error.message}`;
      }

      // 触发错误事件
      const event = new CustomEvent('userPositionError', {
        detail: error.message
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * 距离筛选
   */
  filterByDistance(distance) {
    if (!this.userLocation || !distance) {
      this.currentHotspots = this.allHotspots;
    } else {
      const hotspotsWithDistance = this.currentHotspots.map(h => {
        const hotspotLocation = L.latLng(h.lat, h.lng);
        const dist = this.map.distance(this.userLocation, hotspotLocation) / 1000; // km
        return { ...h, distance: dist };
      });

      if (distance === null) {
        // 不筛选
      } else {
        hotspotsWithDistance = hotspotsWithDistance.filter(h => h.distance <= distance);
      }

      this.currentHotspots = hotspotsWithDistance;
      this.renderHotspots(this.currentHotspots);
      this.updateStats();
    }
  }
}

// 全局导出
window.HotspotMapApp = HotspotMapApp;
window.createIcon = createIcon;
window.getHotspotTypeLabel = getHotspotTypeLabel;
window.getPlatformName = getPlatformName;
window.getHotspotTypeClass = getHotspotTypeClass;
window.getInfluenceLevel = getInfluenceLevel;
window.getInfluenceLabel = getInfluenceLabel;

console.log('✅ 应用类已加载');
