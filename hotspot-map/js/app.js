// 热点地图 - 主应用入口

// 全局变量挂载到 window 对象
window.map = null;
window.allHotspots = [];
window.currentHotspots = [];
window.hotspotLayers = [];
window.currentQuickFilter = 'all';
window.userLocation = null;
window.distanceFilter = null; // 距离筛选：null = 全部, 5, 10, 50 (km)

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', async function() {
  const appStartTime = Date.now();
  Logger.info('🗺️ 热点地图启动中...');

  // 1. 初始化地图
  window.initMap();
  Logger.debug('地图初始化完成');

  // 1.5 初始化地理位置
  if (typeof GeoLocation !== 'undefined') {
    GeoLocation.init(window.map);
    Logger.debug('地理位置功能已初始化');
  }

  // 2. 加载并处理数据
  await loadData();
  Logger.info('数据加载完成', { total: window.allHotspots.length });

  // 3. 初始化筛选器
  window.initFilter(window.allHotspots);
  Logger.debug('筛选器初始化完成');

  // 4. 渲染热点
  window.renderHotspots(window.currentHotspots);
  Logger.debug('热点渲染完成', { layers: window.hotspotLayers.length });

  // 5. 更新统计
  window.updateStats();
  Logger.debug('统计更新完成');

  // 6. 添加图例
  window.addLegend();
  Logger.debug('图例添加完成');

  // 7. 调整地图视野
  window.fitBoundsToHotspots(window.currentHotspots);
  Logger.debug('地图视野调整完成');

  const totalElapsed = Date.now() - appStartTime;
  Logger.info(`🎉 热点地图启动成功！`, {
    displayed: window.currentHotspots.length,
    total: window.allHotspots.length,
    elapsed: `${totalElapsed}ms`
  });

  // 监听位置获取事件
  if (typeof GeoLocation !== 'undefined') {
    window.addEventListener('userPositionFound', handleUserPositionFound);
    window.addEventListener('userPositionError', handleUserPositionError);
  }
});

/**
 * 加载数据
 */
async function loadData() {
  const startTime = Date.now();
  try {
    Logger.debug('正在从 API 获取热点数据');

    // 从 API 获取数据
    window.allHotspots = await window.fetchHotspots();

    Logger.debug('加载热点数据', { count: window.allHotspots.length });

    // 计算影响力等级
    window.allHotspots.forEach(hotspot => {
      hotspot.influenceLevel = getInfluenceLevel(hotspot.influenceScore);
    });

    // 按影响力评分排序（从高到低）
    window.allHotspots.sort((a, b) => b.influenceScore - a.influenceScore);

    // 只保留 Top 30 个热点（避免拥挤）
    window.allHotspots = window.allHotspots.slice(0, 30);

    Logger.debug('优化后展示', { count: window.allHotspots.length });

    // 按城市分组统计（用于调试）
    const cityGroups = {};
    window.allHotspots.forEach(h => {
      const city = h.location.city;
      cityGroups[city] = (cityGroups[city] || 0) + 1;
    });
    Logger.debug('城市分布', cityGroups);

    window.currentHotspots = [...window.allHotspots];
  } catch (error) {
    Logger.error('从 API 加载数据失败，使用模拟数据', error);

    // 降级到模拟数据
    window.allHotspots = mockHotspots;

    // 计算影响力等级
    window.allHotspots.forEach(hotspot => {
      hotspot.influenceLevel = getInfluenceLevel(hotspot.influenceScore);
    });

    // 按影响力评分排序
    window.allHotspots.sort((a, b) => b.influenceScore - a.influenceScore);

    // 只保留 Top 30 个热点
    window.allHotspots = window.allHotspots.slice(0, 30);

    Logger.debug('使用模拟数据', { count: window.allHotspots.length });

    window.currentHotspots = [...window.allHotspots];
  }
}

/**
 * 渲染热点
 */
function renderHotspots(hotspots) {
  if (!hotspots) return;

  const startTime = Date.now();
  Logger.debug('开始渲染热点', { count: hotspots.length });

  // 清除已有图层
  window.hotspotLayers.forEach(layer => window.map.removeLayer(layer));
  window.hotspotLayers = [];

  hotspots.forEach((hotspot, index) => {
    const color = getInfluenceColor(hotspot.influenceScore);
    const radius = getInfluenceRadius(hotspot.influenceScore);

    // 创建热点圈
    const circle = L.circle([hotspot.location.lat, hotspot.location.lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.3,
      weight: 2,
      radius: radius,
      className: 'pulse-circle'
    }).addTo(window.map);

    // 创建标记点
    const marker = L.marker([hotspot.location.lat, hotspot.location.lng], {
      icon: L.divIcon({
        className: 'hotspot-marker',
        html: `<div style="font-size: 28px;">${getPlatformIcon(hotspot.platform)}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(window.map);

    // 创建 Popup
    const popup = L.popup({
      maxWidth: 320,
      minWidth: 280
    }).setContent(createPopupContent(hotspot));

    marker.bindPopup(popup);

    // 点击热点圈也显示 popup
    circle.bindPopup(popup);

    window.hotspotLayers.push(circle, marker);
  });

  const elapsed = Date.now() - startTime;
  Logger.debug('热点渲染完成', { layers: window.hotspotLayers.length, elapsed: `${elapsed}ms` });
}

/**
 * 调整地图视野以包含所有热点
 */
function fitBoundsToHotspots(hotspots) {
  const map = window.map;
  if (!hotspots || hotspots.length === 0) return;

  const bounds = L.latLngBounds(
    hotspots.map(h => [h.location.lat, h.location.lng])
  );
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
}

/**
 * 获取影响力等级
 */
function getInfluenceLevel(score) {
  if (score > 0.8) return 'very_high';
  if (score > 0.6) return 'high';
  if (score > 0.4) return 'medium';
  if (score > 0.2) return 'low';
  return 'emerging';
}

/**
 * 获取影响力颜色
 */
function getInfluenceColor(score) {
  if (score > 0.8) return '#FF0000';
  if (score > 0.6) return '#FF6600';
  if (score > 0.4) return '#FFCC00';
  if (score > 0.2) return '#00CCFF';
  return '#00CC00';
}

/**
 * 获取影响力半径
 */
function getInfluenceRadius(score) {
  if (score > 0.8) return 30000;
  if (score > 0.6) return 20000;
  if (score > 0.4) return 15000;
  if (score > 0.2) return 10000;
  return 8000;
}

/**
 * 获取平台图标
 */
function getPlatformIcon(platform) {
  const icons = {
    xiaohongshu: '📕',
    weibo: '📟',
    douyin: '🎵',
    bilibili: '📺️'
  };
  return icons[platform] || '📍';
}

/**
 * 创建 Popup 内容
 */
function createPopupContent(hotspot) {
  return `
    <div style="padding: 10px; min-width: 250px;">
      <h3 style="margin: 0 0 10px 0; color: #333;">${hotspot.title}</h3>
      <div style="margin-bottom: 10px; font-size: 14px;">
        <span style="background: #f0f0f0; padding: 3px 8px; border-radius: 3px;">
          ${getPlatformIcon(hotspot.platform)} ${hotspot.platform.toUpperCase()}
        </span>
        <span style="background: #e3f2fd; padding: 3px 8px; border-radius: 3px; margin-left: 5px;">
          影响力: ${(hotspot.influenceScore * 100).toFixed(0)}
        </span>
      </div>
      <div style="margin-bottom: 10px; font-size: 13px;">
        <strong>📍 ${hotspot.location.city}, ${hotspot.location.district}</strong>
      </div>
      <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
        <strong>作者:</strong> ${hotspot.metadata.author || '未知'}<br>
        <strong>发布时间:</strong> ${hotspot.metadata.publishTime ? new Date(hotspot.metadata.publishTime).toLocaleString('zh-CN') : '未知'}
      </div>
      <div style="font-size: 12px; color: #666;">
        <strong>👍 ${hotspot.metrics.likes || 0}</strong>
        ${hotspot.metrics.collects ? `<span style="margin-left: 10px;">⭐ ${hotspot.metrics.collects}</span>` : ''}
        ${hotspot.metrics.shares ? `<span style="margin-left: 10px;">🔄 ${hotspot.metrics.shares}</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * 获取所有热点
 */
function getAllHotspots() {
  return window.allHotspots;
}

/**
 * 获取当前热点
 */
function getCurrentHotspots() {
  return window.currentHotspots;
}

/**
 * 获取地图实例
 */
function getMap() {
  return window.map;
}

/**
 * 搜索热点
 */
async function searchHotspots() {
  const searchInput = document.getElementById('search-input');
  const searchStatus = document.getElementById('search-status');
  const query = searchInput.value.trim();

  if (!query) {
    // 如果搜索框为空，恢复显示所有热点
    window.currentHotspots = [...window.allHotspots];
    window.renderHotspots(window.currentHotspots);
    window.updateStats();
    window.fitBoundsToHotspots(window.currentHotspots);
    searchStatus.textContent = '';
    return;
  }

  try {
    searchStatus.textContent = '🔍 搜索中...';
    searchStatus.style.color = '#1890ff';

    const results = await window.searchHotspots(query);

    if (results.length === 0) {
      searchStatus.textContent = `❌ 未找到 "${query}" 相关热点`;
      searchStatus.style.color = '#ff4d4f';
      window.currentHotspots = [];
      window.renderHotspots([]);
      window.updateStats();
    } else {
      searchStatus.textContent = `✅ 找到 ${results.length} 个 "${query}" 相关热点`;
      searchStatus.style.color = '#52c41a';
      window.currentHotspots = results;
      window.renderHotspots(window.currentHotspots);
      window.updateStats();
      window.fitBoundsToHotspots(window.currentHotspots);
    }
  } catch (error) {
    Logger.error('搜索失败', error);
    searchStatus.textContent = '❌ 搜索失败，请稍后重试';
    searchStatus.style.color = '#ff4d4f';
  }
}

/**
 * 处理搜索框回车事件
 */
function handleSearchKeypress(event) {
  if (event.key === 'Enter') {
    searchHotspots();
  }
}

/**
 * 刷新数据
 */
async function refreshData() {
  const refreshBtn = document.getElementById('refresh-btn');
  const refreshStatus = document.getElementById('refresh-status');

  // 禁用按钮并显示加载状态
  refreshBtn.disabled = true;
  refreshBtn.textContent = '🔄 刷新中...';
  refreshStatus.textContent = '正在获取最新数据...';
  refreshStatus.style.color = '#1890ff';

  try {
    Logger.info('开始刷新数据');

    // 重新加载数据
    await loadData();

    // 应用当前的筛选条件
    applyCurrentFilters();

    // 更新统计
    updateStats();

    refreshStatus.textContent = `✅ 数据已更新！共 ${window.allHotspots.length} 个热点`;
    refreshStatus.style.color = '#52c41a';

    Logger.info('数据刷新完成', { total: window.allHotspots.length });
  } catch (error) {
    Logger.error('数据刷新失败', error);
    refreshStatus.textContent = '❌ 刷新失败，请稍后重试';
    refreshStatus.style.color = '#ff4d4f';
  } finally {
    // 恢复按钮状态
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 刷新数据';

    // 3秒后清除状态
    setTimeout(() => {
      refreshStatus.textContent = '';
    }, 3000);
  }
}

/**
 * 应用当前的筛选条件
 */
function applyCurrentFilters() {
  let filtered = [...window.allHotspots];

  // 应用类型筛选
  if (window.currentQuickFilter !== 'all') {
    const typeMap = {
      'food': 'food',
      'tourism': 'tourism',
      'event': 'event',
      'social': 'social',
      'acg': 'acg'
    };

    // 漫展活动包含 event 和 acg
    if (window.currentQuickFilter === 'event') {
      filtered = filtered.filter(h => h.type === 'event' || h.type === 'acg');
    } else if (typeMap[window.currentQuickFilter]) {
      filtered = filtered.filter(h => h.type === typeMap[window.currentQuickFilter]);
    }
  }

  // 应用平台筛选
  const platforms = [];
  if (document.getElementById('plat-xiaohongshu')?.checked) platforms.push('xiaohongshu');
  if (document.getElementById('plat-weibo')?.checked) platforms.push('weibo');
  if (document.getElementById('plat-douyin')?.checked) platforms.push('douyin');
  if (document.getElementById('plat-bilibili')?.checked) platforms.push('bilibili');

  if (platforms.length > 0 && platforms.length < 4) {
    filtered = filtered.filter(h => platforms.includes(h.platform));
  }

  // 应用距离筛选
  if (window.distanceFilter !== null && window.userLocation) {
    filtered = filtered.filter(h => h.distance !== undefined && h.distance <= window.distanceFilter);
  }

  window.currentHotspots = filtered;
  window.renderHotspots(window.currentHotspots);
  window.fitBoundsToHotspots(window.currentHotspots);
}

// 导出全局函数供 HTML 调用
window.getAllHotspots = getAllHotspots;
window.getCurrentHotspots = getCurrentHotspots;
window.getMap = getMap;
window.renderHotspots = renderHotspots;
window.fitBoundsToHotspots = fitBoundsToHotspots;
window.searchHotspots = searchHotspots;
window.handleSearchKeypress = handleSearchKeypress;
window.refreshData = refreshData;
window.locateUser = locateUser;
window.sortHotspotsByDistance = sortHotspotsByDistance;
window.filterByDistance = filterByDistance;

/**
 * 处理用户位置获取成功事件
 */
function handleUserPositionFound(event) {
  Logger.info('用户位置获取成功', event.detail);
  window.userLocation = event.detail;

  // 更新状态显示
  const locationStatus = document.getElementById('location-status');
  if (locationStatus) {
    locationStatus.innerHTML = `
      ✅ 定位成功<br>
      <small style="color: #666;">
        纬度: ${event.detail.latitude.toFixed(4)}<br>
        经度: ${event.detail.longitude.toFixed(4)}<br>
        精度: ${event.detail.accuracy}米
      </small>
    `;
    locationStatus.style.color = '#52c41a';
  }

  // 启用按距离排序按钮
  const sortBtn = document.getElementById('sort-btn');
  if (sortBtn) {
    sortBtn.disabled = false;
  }

  // 计算所有热点的距离
  calculateHotspotDistances();

  // 重新渲染热点（现在包含距离信息）
  window.renderHotspots(window.currentHotspots);
}

/**
 * 处理用户位置获取失败事件
 */
function handleUserPositionError(event) {
  Logger.error('用户位置获取失败', event.detail);

  const locationStatus = document.getElementById('location-status');
  if (locationStatus) {
    locationStatus.textContent = '❌ 定位失败，请检查浏览器权限';
    locationStatus.style.color = '#ff4d4f';
  }

  const sortBtn = document.getElementById('sort-btn');
  if (sortBtn) {
    sortBtn.disabled = true;
  }
}

/**
 * 计算所有热点的距离
 */
function calculateHotspotDistances() {
  if (!window.userLocation) {
    Logger.warn('用户位置未知，无法计算距离');
    return;
  }

  window.allHotspots.forEach(hotspot => {
    if (typeof GeoLocation !== 'undefined') {
      const distance = GeoLocation.getDistanceFromUser(
        hotspot.location.lat,
        hotspot.location.lng
      );

      if (distance !== null) {
        hotspot.distance = distance;
        hotspot.distanceFormatted = GeoLocation.formatDistance(distance);
      }
    }
  });

  Logger.debug('已计算所有热点的距离');
}

/**
 * 定位用户位置
 */
function locateUser() {
  Logger.info('开始定位用户位置');

  const locationStatus = document.getElementById('location-status');
  if (locationStatus) {
    locationStatus.textContent = '📍 正在获取您的位置...';
    locationStatus.style.color = '#1890ff';
  }

  if (typeof GeoLocation !== 'undefined') {
    GeoLocation.tryGetLocation();
  } else {
    Logger.error('GeoLocation 未加载');
    if (locationStatus) {
      locationStatus.textContent = '❌ 地理位置功能未加载';
      locationStatus.style.color = '#ff4d4f';
    }
  }
}

/**
 * 按距离排序热点
 */
function sortHotspotsByDistance() {
  if (!window.userLocation) {
    Logger.warn('用户位置未知，无法按距离排序');
    return;
  }

  const sortBtn = document.getElementById('sort-btn');

  // 切换排序状态
  if (sortBtn.dataset.sorted === 'true') {
    // 取消排序，恢复默认排序（按影响力）
    window.currentHotspots.sort((a, b) => b.influenceScore - a.influenceScore);
    sortBtn.textContent = '📏 按距离排序';
    sortBtn.dataset.sorted = 'false';
    Logger.debug('已恢复按影响力排序');
  } else {
    // 按距离排序（从近到远）
    window.currentHotspots.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    sortBtn.textContent = '📏 取消距离排序';
    sortBtn.dataset.sorted = 'true';
    Logger.debug('已按距离排序');
  }

  // 重新渲染
  window.renderHotspots(window.currentHotspots);
  window.fitBoundsToHotspots(window.currentHotspots);
}

/**
 * 按距离筛选热点
 */
function filterByDistance(maxDistance) {
  Logger.debug('按距离筛选', { maxDistance: maxDistance === null ? '全部' : `${maxDistance}km` });

  window.distanceFilter = maxDistance;
  applyCurrentFilters();

  // 更新按钮状态
  const buttons = document.querySelectorAll('.distance-filter-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.distance === String(maxDistance)) {
      btn.classList.add('active');
    }
  });
}

/**
 * 重写 createPopupContent 以包含距离信息
 */
const originalCreatePopupContent = createPopupContent;
createPopupContent = function(hotspot) {
  let content = originalCreatePopupContent(hotspot);

  // 如果有距离信息，添加到内容中
  if (hotspot.distance !== undefined && hotspot.distanceFormatted) {
    const distanceInfo = `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #1890ff;">
        <strong>📏 距离您: ${hotspot.distanceFormatted}</strong>
      </div>
    `;

    // 在 </div> 之前插入距离信息
    content = content.replace('</div>', distanceInfo + '</div>');
  }

  return content;
};
