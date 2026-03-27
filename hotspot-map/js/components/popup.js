// Popup 组件

import { formatDistance, formatDistanceFull, getNavigationLink } from '../utils/geo.js';

// Popup 组件

/**
 * 创建 Popup 内容（阶段 1 优化：使用 Popup Cache）
 * @param {Object} hotspot - 热点对象
 * @param {Object} userLocation - 用户位置（可选）
 * @returns {string} Popup HTML 内容
 */
function createPopupContent(hotspot, userLocation = null) {
  // 阶段 1 优化：使用 Popup Cache
  if (window.cacheManager) {
    const cachedContent = window.cacheManager.getPopupContent(hotspot);
    if (cachedContent) {
      // 如果有用户位置，需要动态添加距离信息
      if (userLocation && hotspot.distance !== null && hotspot.distance !== undefined) {
        // 克隆缓存的 DOM 元素以避免修改缓存
        const clonedContent = cachedContent.cloneNode(true);
        const distanceHTML = `
          <div class="popup-distance">
            <span class="distance-label">📍 ${formatDistanceFull(hotspot.distance)}</span>
          </div>
        `;
        // 在正确的位置插入距离信息
        const locationDiv = clonedContent.querySelector('div[style*="margin-top: 6px"]');
        if (locationDiv) {
          locationDiv.insertAdjacentHTML('afterend', distanceHTML);
        }
        return clonedContent.outerHTML;
      }
      return cachedContent.outerHTML;
    }
  }

  // 没有缓存或缓存管理器不可用，生成新内容
  const typeLabel = getHotspotTypeLabel(hotspot.type);
  const influenceLabel = getInfluenceLabel(hotspot.influenceScore);
  const platformName = getPlatformName(hotspot.platform);
  const platformIcon = getPlatformIcon(hotspot.platform);

  // 计算距离
  let distanceHTML = '';
  if (userLocation && hotspot.distance !== null && hotspot.distance !== undefined) {
    distanceHTML = `
      <div class="popup-distance">
        <span class="distance-label">📍 ${formatDistanceFull(hotspot.distance)}</span>
      </div>
    `;
  }

  let metadataHTML = '';
  if (hotspot.metrics) {
    Object.entries(hotspot.metrics).forEach(([key, value]) => {
      const labelMap = {
        likes: '👍 点赞',
        collects: '⭐ 收藏',
        readCount: '👁 阅读',
        discussCount: '💬 讨论',
        views: '👁 播放',
        shares: '🔗 分享',
        comments: '💬 评论',
        coins: '🪙 投币'
      };
      if (labelMap[key] && value > 0) {
        metadataHTML += `<div>${labelMap[key]}: ${formatNumber(value)}</div>`;
      }
    });
  }

  // 添加作者信息
  if (hotspot.metadata?.author) {
    metadataHTML += `<div>👤 作者: ${hotspot.metadata.author}</div>`;
  }

  // 添加分类信息
  if (hotspot.metadata?.category) {
    metadataHTML += `<div>📂 分类: ${hotspot.metadata.category}</div>`;
  }

  // 添加导航链接
  let navLinkHTML = '';
  if (hotspot.lat && hotspot.lng) {
    const gaodeLink = getNavigationLink(hotspot.lat, hotspot.lng, hotspot.title, 'gaode');
    navLinkHTML = `
      <div class="popup-nav">
        <a href="${gaodeLink}" target="_blank" class="nav-btn">
          🚀 导航
        </a>
      </div>
    `;
  }

  return `
    <div class="popup-content">
      <div class="popup-header">
        ${platformIcon}
        ${hotspot.title}
      </div>
      <div class="popup-influence">
        <div class="score">📊 影响力: ${hotspot.influenceScore.toFixed(2)}</div>
        <div class="level">${influenceLabel}</div>
      </div>
      <span class="popup-type">${typeLabel}</span>
      <div style="margin-top: 8px; font-size: 13px; color: #666;">
        平台: ${platformName}
      </div>
      <div style="margin-top: 6px; font-size: 13px; color: #666;">
        📍 ${hotspot.location.city} · ${hotspot.location.district}
      </div>
      ${distanceHTML}
      ${metadataHTML ? `<div class="popup-metadata">${metadataHTML}</div>` : ''}
      ${navLinkHTML}
    </div>
  `;
}
