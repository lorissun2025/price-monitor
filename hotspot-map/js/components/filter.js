// 筛选组件
// 全局状态由 app.js 统一管理

let currentQuickFilter = 'all';

/**
 * 初始化筛选器
 * @param {Array} hotspots - 所有热点
 */
function initFilter(hotspots) {
  // app.js 已经管理了 allHotspots 和 currentHotspots，这里不做处理
  logger.debug('筛选器初始化完成');
}

/**
 * 快捷筛选
 * @param {string} type - 筛选类型
 */
function _quickFilter(type) {
  currentQuickFilter = type;
  window.currentQuickFilter = type;

  // 更新按钮状态
  document.querySelectorAll('.quick-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = Array.from(document.querySelectorAll('.quick-filter'))
    .find(btn => btn.onclick.toString().includes(`'${type}'`));
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // 使用 app.js 的统一筛选（保留距离筛选）
  if (typeof window.applyCurrentFilters === 'function') {
    window.applyCurrentFilters();
    window.updateStats();
  } else {
    // 回退：根据类型设置筛选条件
    let typesToInclude = [];
    let platformsToInclude = null;

    switch(type) {
      case 'all':
        typesToInclude = ['food', 'tourism', 'event', 'acg', 'social_trend'];
        break;
      case 'food':
        typesToInclude = ['food'];
        platformsToInclude = ['xiaohongshu', 'douyin'];
        break;
      case 'tourism':
        typesToInclude = ['tourism'];
        platformsToInclude = ['xiaohongshu', 'douyin'];
        break;
      case 'event':
        typesToInclude = ['event', 'acg'];
        platformsToInclude = ['weibo', 'douyin', 'bilibili'];
        break;
      case 'social':
        typesToInclude = ['social_trend'];
        platformsToInclude = ['weibo'];
        break;
    }
    applyFilter(typesToInclude, platformsToInclude);
  }
}

/**
 * 按平台筛选
 * @param {string} platform - 平台
 * @param {boolean} checked - 是否选中
 */
function _filterByPlatform(platform, checked) {
  // 使用 app.js 的统一筛选（保留距离筛选）
  if (typeof window.applyCurrentFilters === 'function') {
    window.applyCurrentFilters();
    window.updateStats();
  } else {
    // 回退逻辑
    if (currentQuickFilter !== 'all') {
      currentQuickFilter = 'all';
      window.currentQuickFilter = 'all';
      document.querySelectorAll('.quick-filter').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector('.quick-filter').classList.add('active');
    }
    const selectedPlatforms = getSelectedPlatforms();
    applyFilter(null, selectedPlatforms);
  }
}

/**
 * 应用筛选
 * @param {Array|null} typesToInclude - 要包含的类型列表
 * @param {Array|null} platformsToInclude - 要包含的平台列表
 */
function applyFilter(typesToInclude, platformsToInclude) {
  const allHotspots = window.getAllHotspots();

  window.currentHotspots = allHotspots.filter(h => {
    // 类型筛选
    let typeMatch = true;
    if (typesToInclude) {
      typeMatch = typesToInclude.includes(h.type);
    }

    // 平台筛选
    let platformMatch = true;
    if (platformsToInclude && platformsToInclude.length > 0) {
      platformMatch = platformsToInclude.includes(h.platform);
    }

    return typeMatch && platformMatch;
  });

  // 重新渲染
  window.renderHotspots(window.currentHotspots);
  window.updateStats();
}

/**
 * 获取选中的平台
 * @returns {Array} 选中的平台列表
 */
function getSelectedPlatforms() {
  const platforms = [];
  if (document.getElementById('plat-xiaohongshu').checked) platforms.push('xiaohongshu');
  if (document.getElementById('plat-weibo').checked) platforms.push('weibo');
  if (document.getElementById('plat-douyin').checked) platforms.push('douyin');
  if (document.getElementById('plat-bilibili').checked) platforms.push('bilibili');
  return platforms;
}

/**
 * 获取当前热点
 * @returns {Array} 当前热点列表
 */
function getCurrentHotspots() {
  return window.currentHotspots;
}

/**
 * 获取所有热点
 * @returns {Array} 所有热点列表
 */
function getAllHotspots() {
  return window.allHotspots;
}

// 导出全局函数供 HTML 调用
window.initFilter = initFilter;
window.quickFilter = _quickFilter;
window.filterByPlatform = _filterByPlatform;
window.getCurrentHotspots = getCurrentHotspots;
window.getAllHotspots = getAllHotspots;

