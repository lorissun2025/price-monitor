// 影响力评分工具函数

/**
 * 计算影响力等级
 */
function getInfluenceLevel(score) {
  if (score > 0.8) return InfluenceLevel.VERY_HIGH;
  if (score > 0.6) return InfluenceLevel.HIGH;
  if (score > 0.4) return InfluenceLevel.MEDIUM;
  if (score > 0.2) return InfluenceLevel.LOW;
  return InfluenceLevel.EMERGING;
}

/**
 * 获取影响力颜色
 */
function getInfluenceColor(score) {
  if (score > 0.8) return '#FF0000';    // 红色 - 极高影响力
  if (score > 0.6) return '#FF6600';    // 橙色 - 高影响力
  if (score > 0.4) return '#FFCC00';    // 黄色 - 中等影响力
  if (score > 0.2) return '#00CCFF';    // 蓝色 - 低影响力
  return '#00CC00';                      // 绿色 - 新兴热点
}

/**
 * 获取影响力半径
 */
function getInfluenceRadius(score) {
  return 5000 + score * 10000;  // 5km - 150km
}

/**
 * 获取影响力标签
 */
function getInfluenceLabel(score) {
  if (score > 0.8) return '🔥 极高影响力';
  if (score > 0.6) return '⭐ 高影响力';
  if (score > 0.4) return '⭐⭐ 中等影响力';
  if (score > 0.2) return '⭐⭐ 新兴热点';
  return '⭐ 新兴热点';
}

/**
 * 格式化数字
 */
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * 获取热点类型标签
 */
function getHotspotTypeLabel(type) {
  const labels = {
    food: '🍜 美食',
    tourism: '🏝 旅游',
    event: '🎪 活动',
    acg: '🎮 ACG',
    social_trend: '📰 社交热点',
    other: '📍 综合'
  };
  return labels[type] || '📌 其他';
}

/**
 * 获取平台图标
 */
function getPlatformIcon(platform) {
  const icons = {
    xiaohongshu: '📕',
    weibo: '📟',
    douyin: '🎵',
    bilibili: '📺'
  };
  return icons[platform] || '📍';
}

/**
 * 获取平台名称
 */
function getPlatformName(platform) {
  const names = {
    xiaohongshu: '📕 小红书',
    weibo: '📟 微博',
    douyin: '🎵 抖音',
    bilibili: '📺️ B站'
  };
  return names[platform] || platform;
}
