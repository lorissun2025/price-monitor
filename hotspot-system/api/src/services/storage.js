// 数据存储服务

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../../data');
const hotspotsFile = join(dataDir, 'hotspots.json');

// 确保数据目录存在
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  // 目录已存在，忽略
}

/**
 * 读取热点数据
 */
export function readHotspots() {
  try {
    const content = readFileSync(hotspotsFile, 'utf-8');
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 文件不存在，返回空数据
      return {
        version: '1.0',
        lastUpdate: null,
        hotspots: []
      };
    }
    throw error;
  }
}

/**
 * 写入热点数据
 */
export function writeHotspots(data) {
  const output = {
    version: '1.0',
    lastUpdate: new Date().toISOString(),
    hotspots: data
  };

  writeFileSync(hotspotsFile, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 数据已保存到: ${hotspotsFile}`);
}

/**
 * 更新热点数据（合并新旧数据）
 */
export function updateHotspots(newHotspots, options = {}) {
  const { keepOld = true, maxTotal = 100 } = options;

  const existing = readHotspots();
  const oldHotspots = existing.hotspots || [];

  let mergedHotspots;

  if (keepOld) {
    // 合并新旧数据，去重（按 ID）
    const allHotspots = [...newHotspots, ...oldHotspots];
    const uniqueHotspots = new Map();

    // 按发布时间排序，保留最新的
    allHotspots.forEach(h => {
      const existing = uniqueHotspots.get(h.id);
      if (!existing || new Date(h.metadata.publishTime) > new Date(existing.metadata.publishTime)) {
        uniqueHotspots.set(h.id, h);
      }
    });

    mergedHotspots = Array.from(uniqueHotspots.values());

    // 限制总数
    if (mergedHotspots.length > maxTotal) {
      // 按影响力评分和发布时间排序
      mergedHotspots.sort((a, b) => {
        if (b.influenceScore !== a.influenceScore) {
          return b.influenceScore - a.influenceScore;
        }
        return new Date(b.metadata.publishTime) - new Date(a.metadata.publishTime);
      });
      mergedHotspots = mergedHotspots.slice(0, maxTotal);
    }
  } else {
    // 只保留新数据
    mergedHotspots = newHotspots;
  }

  writeHotspots(mergedHotspots);

  return {
    total: mergedHotspots.length,
    added: newHotspots.length,
    kept: keepOld ? oldHotspots.length : 0,
    duplicates: keepOld ? newHotspots.length - (mergedHotspots.length - oldHotspots.length) : 0
  };
}

/**
 * 获取统计信息
 */
export function getStats() {
  const data = readHotspots();
  const hotspots = data.hotspots || [];

  const stats = {
    total: hotspots.length,
    lastUpdate: data.lastUpdate,
    byPlatform: {},
    byType: {},
    byCity: {},
    byInfluence: {
      very_high: 0,
      high: 0,
      medium: 0,
      low: 0,
      emerging: 0
    }
  };

  hotspots.forEach(h => {
    // 按平台
    stats.byPlatform[h.platform] = (stats.byPlatform[h.platform] || 0) + 1;

    // 按类型
    stats.byType[h.type] = (stats.byType[h.type] || 0) + 1;

    // 按城市
    const city = h.location?.city || '未知';
    stats.byCity[city] = (stats.byCity[city] || 0) + 1;

    // 按影响力
    const influenceLevel = getInfluenceLevel(h.influenceScore);
    stats.byInfluence[influenceLevel]++;
  });

  return stats;
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

export default {
  readHotspots,
  writeHotspots,
  updateHotspots,
  getStats
};
