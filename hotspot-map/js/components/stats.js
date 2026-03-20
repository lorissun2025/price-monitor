// 统计面板组件

/**
 * 更新统计数据
 */
function updateStats() {
  const allHotspots = window.getAllHotspots();
  const currentHotspots = getCurrentHotspots();

  // 总数（显示所有热点，不是当前筛选后的）
  document.getElementById('stat-total').textContent = allHotspots.length;

  // 各平台数量（使用当前筛选后的数据）
  document.getElementById('stat-xiaohongshu').textContent =
    currentHotspots.filter(h => h.platform === 'xiaohongshu').length;
  document.getElementById('stat-weibo').textContent =
    currentHotspots.filter(h => h.platform === 'weibo').length;
  document.getElementById('stat-douyin').textContent =
    currentHotspots.filter(h => h.platform === 'douyin').length;
  document.getElementById('stat-bilibili').textContent =
    currentHotspots.filter(h => h.platform === 'bilibili').length;

  // 更新距离统计（如果已定位）
  updateDistanceStats(currentHotspots);
}

/**
 * 更新距离统计
 * @param {Array} hotspots - 热点数组
 */
function updateDistanceStats(hotspots) {
  const userLocation = window.userLocation;

  // 如果未定位，不显示距离统计
  if (!userLocation) {
    // 检查是否已有距离统计元素，如果有则隐藏
    const distanceStatsContainer = document.getElementById('distance-stats');
    if (distanceStatsContainer) {
      distanceStatsContainer.style.display = 'none';
    }
    return;
  }

  // 计算距离统计
  const distances = hotspots
    .filter(h => h.distance !== undefined && h.distance !== null)
    .map(h => h.distance);

  if (distances.length === 0) {
    // 没有有效的距离数据
    return;
  }

  const nearest = Math.min(...distances);
  const farthest = Math.max(...distances);
  const average = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const within5km = distances.filter(d => d <= 5).length;
  const within10km = distances.filter(d => d <= 10).length;
  const within50km = distances.filter(d => d <= 50).length;

  // 格式化距离显示
  const formatDist = (d) => d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;

  // 更新或创建距离统计元素
  let distanceStatsContainer = document.getElementById('distance-stats');
  if (!distanceStatsContainer) {
    // 创建距离统计容器
    distanceStatsContainer = document.createElement('div');
    distanceStatsContainer.id = 'distance-stats';
    distanceStatsContainer.className = 'distance-stats';

    // 插入到热点统计之后
    const statsSection = document.querySelector('.section:last-of-type');
    if (statsSection) {
      statsSection.appendChild(distanceStatsContainer);
    }
  }

  distanceStatsContainer.innerHTML = `
    <div class="stat-item">
      <span>📏 最近距离</span>
      <span class="stat-value">${formatDist(nearest)}</span>
    </div>
    <div class="stat-item">
      <span>📏 平均距离</span>
      <span class="stat-value">${formatDist(average)}</span>
    </div>
    <div class="stat-item">
      <span>📍 5km 内</span>
      <span class="stat-value">${within5km} 个</span>
    </div>
    <div class="stat-item">
      <span>📍 10km 内</span>
      <span class="stat-value">${within10km} 个</span>
    </div>
    <div class="stat-item">
      <span>📍 50km 内</span>
      <span class="stat-value">${within50km} 个</span>
    </div>
  `;

  distanceStatsContainer.style.display = 'block';
}

/**
 * 获取统计数据
 * @returns {Object} 统计数据对象
 */
function getStats() {
  const hotspots = getCurrentHotspots();

  return {
    total: hotspots.length,
    byPlatform: {
      xiaohongshu: hotspots.filter(h => h.platform === 'xiaohongshu').length,
      weibo: hotspots.filter(h => h.platform === 'weibo').length,
      douyin: hotspots.filter(h => h.platform === 'douyin').length,
      bilibili: hotspots.filter(h => h.platform === 'bilibili').length
    },
    byType: {
      food: hotspots.filter(h => h.type === 'food').length,
      tourism: hotspots.filter(h => h.type === 'tourism').length,
      event: hotspots.filter(h => h.type === 'event').length,
      acg: hotspots.filter(h => h.type === 'acg').length,
      social_trend: hotspots.filter(h => h.type === 'social_trend').length,
      other: hotspots.filter(h => h.type === 'other').length
    },
    byInfluence: {
      very_high: hotspots.filter(h => h.influenceScore > 0.8).length,
      high: hotspots.filter(h => h.influenceScore > 0.6 && h.influenceScore <= 0.8).length,
      medium: hotspots.filter(h => h.influenceScore > 0.4 && h.influenceScore <= 0.6).length,
      low: hotspots.filter(h => h.influenceScore > 0.2 && h.influenceScore <= 0.4).length,
      emerging: hotspots.filter(h => h.influenceScore <= 0.2).length
    },
    byDistance: getDistanceStats(hotspots)
  };
}

/**
 * 获取距离统计
 * @param {Array} hotspots - 热点数组
 * @returns {Object|null} 距离统计对象，未定位时返回 null
 */
function getDistanceStats(hotspots) {
  const userLocation = window.userLocation;

  if (!userLocation) {
    return null;
  }

  const distances = hotspots
    .filter(h => h.distance !== undefined && h.distance !== null)
    .map(h => h.distance);

  if (distances.length === 0) {
    return null;
  }

  return {
    nearest: Math.min(...distances),
    farthest: Math.max(...distances),
    average: distances.reduce((sum, d) => sum + d, 0) / distances.length,
    within5km: distances.filter(d => d <= 5).length,
    within10km: distances.filter(d => d <= 10).length,
    within50km: distances.filter(d => d <= 50).length
  };
}

// 导出函数供其他模块调用
window.updateStats = updateStats;
window.getStats = getStats;
window.updateDistanceStats = updateDistanceStats;
window.getDistanceStats = getDistanceStats;

