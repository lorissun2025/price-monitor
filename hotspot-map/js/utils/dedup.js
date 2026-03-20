// 热点去重工具函数

/**
 * 计算两个坐标之间的距离 (Haversine 公式)
 * @param {number} lat1 - 第一个点的纬度
 * @param {number} lng1 - 第一个点的经度
 * @param {number} lat2 - 第二个点的纬度
 * @param {number} lng2 - 第二个点的经度
 * @returns {number} 距离 (km)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 计算字符串相似度 (Jaccard 相似度)
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @returns {number} 相似度 (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(''));
  const set2 = new Set(str2.toLowerCase().split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * 判断两个热点是否相似
 * @param {Object} h1 - 第一个热点
 * @param {Object} h2 - 第二个热点
 * @returns {boolean} 是否相似
 */
function isSimilarHotspot(h1, h2) {
  // 1. 时间差 < 24 小时
  const timeDiff = Math.abs(
    new Date(h1.metadata.publishTime).getTime() - new Date(h2.metadata.publishTime).getTime()
  );
  if (timeDiff > 24 * 60 * 60 * 1000) return false;
  
  // 2. 距离 < 500m
  const distance = calculateDistance(
    h1.location.lat, h1.location.lng,
    h2.location.lat, h2.location.lng
  );
  if (distance > 0.5) return false; // 500m
  
  // 3. 标题相似度 > 0.7 (降低阈值，提高召回率)
  const similarity = calculateStringSimilarity(h1.title, h2.title);
  if (similarity < 0.7) return false;
  
  return true;
}

/**
 * 热点去重
 * @param {Array} hotspots - 热点数组
 * @returns {Array} 去重后的热点数组
 */
function deduplicateHotspots(hotspots) {
  if (!hotspots || hotspots.length === 0) return [];
  
  const groups = [];
  const used = new Set();
  
  // 初始化，每个热点一组
  hotspots.forEach((hotspot, index) => {
    groups.push([hotspot]);
    used.add(index);
  });
  
  // 两两比较，合并相似的组
  let merged = true;
  let iterations = 0;
  const maxIterations = hotspots.length * hotspots.length; // 防止无限循环
  
  while (merged && iterations < maxIterations) {
    merged = false;
    
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (shouldMerge(groups[i], groups[j])) {
          // 合并组
          groups[i] = [...groups[i], ...groups[j]];
          groups.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
    
    iterations++;
  }
  
  // 每组选取影响力最高的作为代表
  return groups.map(group => {
    const sorted = group.sort((a, b) => b.influenceScore - a.influenceScore);
    const main = sorted[0];
    
    // 添加其他平台数据
    main.metadata.relatedPlatforms = sorted
      .filter(h => h.platform !== main.platform)
      .map(h => h.platform);
    
    return main;
  });
}

/**
 * 判断两个组是否应该合并
 * @param {Array} group1 - 第一个组
 * @param {Array} group2 - 第二个组
 * @returns {boolean} 是否应该合并
 */
function shouldMerge(group1, group2) {
  // 任意一对热点相似，则合并
  for (const h1 of group1) {
    for (const h2 of group2) {
      if (isSimilarHotspot(h1, h2)) {
        return true;
      }
    }
  }
  return false;
}
