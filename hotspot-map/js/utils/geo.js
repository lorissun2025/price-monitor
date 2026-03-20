/**
 * 地理位置工具模块
 * 提供距离计算、定位处理等功能
 */

/**
 * Haversine 公式计算两点间距离
 * @param {number} lat1 - 起点纬度
 * @param {number} lon1 - 起点经度
 * @param {number} lat2 - 终点纬度
 * @param {number} lon2 - 终点经度
 * @returns {number} 距离（km）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（km）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 返回 km
}

/**
 * 将角度转换为弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 格式化距离显示
 * @param {number} distanceKm - 距离（km）
 * @returns {string} 格式化后的距离字符串
 */
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return '未知';
  }

  if (distanceKm >= 1) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm * 1000)}m`;
  }
}

/**
 * 格式化距离显示（带完整）
 * @param {number} distanceKm - 距离（km）
 * @returns {string} 格式化后的距离字符串
 */
export function formatDistanceFull(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return '距离未知';
  }

  if (distanceKm >= 1) {
    return `距离 ${distanceKm.toFixed(1)} 公里`;
  } else {
    return `距离 ${Math.round(distanceKm * 1000)} 米`;
  }
}

/**
 * 获取用户当前位置
 * @param {Object} options - 定位选项
 * @param {boolean} options.enableHighAccuracy - 是否使用高精度定位
 * @param {number} options.timeout - 超时时间（毫秒）
 * @param {number} options.maximumAge - 缓存最大年龄（毫秒）
 * @returns {Promise<Object>} 位置信息
 */
export function getUserLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 600000
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('您的浏览器不支持地理定位功能'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('用户拒绝了定位请求'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('无法获取位置信息'));
            break;
          case error.TIMEOUT:
            reject(new Error('获取位置超时'));
            break;
          default:
            reject(new Error('获取位置时发生未知错误'));
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  });
}

/**
 * 批量计算热点的距离
 * @param {Array} hotspots - 热点数组
 * @param {number} userLat - 用户纬度
 * @param {number} userLng - 用户经度
 * @returns {Array} 带有距离字段的热点数组
 */
export function calculateDistancesForHotspots(hotspots, userLat, userLng) {
  return hotspots.map(hotspot => {
    if (hotspot.lat !== null && hotspot.lat !== undefined &&
        hotspot.lng !== null && hotspot.lng !== undefined) {
      const distance = calculateDistance(userLat, userLng, hotspot.lat, hotspot.lng);
      return {
        ...hotspot,
        distance,
        calculated: true
      };
    } else {
      return {
        ...hotspot,
        distance: null,
        calculated: false
      };
    }
  });
}

/**
 * 按距离排序热点
 * @param {Array} hotspots - 热点数组（必须已计算距离）
 * @param {string} order - 排序方式（'asc' 从近到远，'desc' 从远到近）
 * @returns {Array} 排序后的热点数组
 */
export function sortByDistance(hotspots, order = 'asc') {
  return [...hotspots].sort((a, b) => {
    if (a.distance === null || a.distance === undefined) return 1;
    if (b.distance === null || b.distance === undefined) return -1;

    if (order === 'asc') {
      return a.distance - b.distance;
    } else {
      return b.distance - a.distance;
    }
  });
}

/**
 * 按距离筛选热点
 * @param {Array} hotspots - 热点数组（必须已计算距离）
 * @param {number} maxDistance - 最大距离（km），null 表示不限制
 * @returns {Array} 筛选后的热点数组
 */
export function filterByDistance(hotspots, maxDistance) {
  if (maxDistance === null || maxDistance === undefined) {
    return hotspots;
  }

  return hotspots.filter(hotspot => {
    if (hotspot.distance === null || hotspot.distance === undefined) {
      return false;
    }
    return hotspot.distance <= maxDistance;
  });
}

/**
 * 计算距离统计信息
 * @param {Array} hotspots - 热点数组（必须已计算距离）
 * @returns {Object} 统计信息
 */
export function calculateDistanceStats(hotspots) {
  const validHotspots = hotspots.filter(h =>
    h.distance !== null && h.distance !== undefined
  );

  if (validHotspots.length === 0) {
    return {
      nearest: null,
      farthest: null,
      average: null,
      count: 0,
      within5km: 0,
      within10km: 0,
      within50km: 0
    };
  }

  const distances = validHotspots.map(h => h.distance);
  const nearest = Math.min(...distances);
  const farthest = Math.max(...distances);
  const average = distances.reduce((sum, d) => sum + d, 0) / distances.length;

  return {
    nearest,
    farthest,
    average,
    count: validHotspots.length,
    within5km: validHotspots.filter(h => h.distance <= 5).length,
    within10km: validHotspots.filter(h => h.distance <= 10).length,
    within50km: validHotspots.filter(h => h.distance <= 50).length
  };
}

/**
 * 生成导航链接
 * @param {number} lat - 目标纬度
 * @param {number} lng - 目标经度
 * @param {string} name - 目标名称
 * @param {string} provider - 导航提供商（'gaode' 或 'baidu'）
 * @returns {string} 导航链接
 */
export function getNavigationLink(lat, lng, name, provider = 'gaode') {
  const encodedName = encodeURIComponent(name);

  if (provider === 'gaode') {
    // 高德地图
    return `https://uri.amap.com/navigation?to=${lng},${lat},${encodedName}&mode=car&src=myapp&coordinate=gaode`;
  } else if (provider === 'baidu') {
    // 百度地图
    return `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodedName}&content=${encodedName}&output=html`;
  }

  // 默认使用 Google Maps（国外）
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * 检查位置是否有效
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @returns {boolean} 是否有效
 */
export function isValidLocation(lat, lng) {
  return (
    lat !== null && lat !== undefined &&
    lng !== null && lng !== undefined &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}
