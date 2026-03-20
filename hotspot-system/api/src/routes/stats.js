import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// 读取数据文件
const getDataFile = () => {
  try {
    const dataPath = join(__dirname, '../../data/hotspots.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    return data;
  } catch (error) {
    console.error('❌ 读取数据文件失败:', error);
    return { hotspots: [], lastUpdate: null };
  }
};

// 计算影响力等级
const getInfluenceLevel = (score) => {
  if (score > 0.8) return 'very_high';
  if (score > 0.6) return 'high';
  if (score > 0.4) return 'medium';
  if (score > 0.2) return 'low';
  return 'emerging';
};

/**
 * GET /api/stats
 * 获取统计数据
 */
router.get('/', (req, res) => {
  try {
    const data = getDataFile();
    const hotspots = data.hotspots;

    // 按平台统计
    const byPlatform = {
      xiaohongshu: 0,
      weibo: 0,
      douyin: 0,
      bilibili: 0
    };

    // 按类型统计
    const byType = {
      food: 0,
      tourism: 0,
      event: 0,
      acg: 0,
      social_trend: 0
    };

    // 按城市统计
    const byCity = {};

    // 按影响力统计
    const byInfluence = {
      very_high: 0,
      high: 0,
      medium: 0,
      low: 0,
      emerging: 0
    };

    // 遍历所有热点进行统计
    hotspots.forEach(h => {
      // 平台
      if (byPlatform[h.platform] !== undefined) {
        byPlatform[h.platform]++;
      }

      // 类型
      if (byType[h.type] !== undefined) {
        byType[h.type]++;
      }

      // 城市
      const city = h.location.city;
      byCity[city] = (byCity[city] || 0) + 1;

      // 影响力
      const level = getInfluenceLevel(h.influenceScore);
      if (byInfluence[level] !== undefined) {
        byInfluence[level]++;
      }
    });

    // 排序城市（按数量降序）
    const sortedByCity = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [city, count]) => {
        acc[city] = count;
        return acc;
      }, {});

    res.json({
      success: true,
      data: {
        total: hotspots.length,
        lastUpdate: data.lastUpdate,
        byPlatform,
        byType,
        byCity: sortedByCity,
        byInfluence
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取统计数据失败',
        details: error.message
      }
    });
  }
});

export default router;
