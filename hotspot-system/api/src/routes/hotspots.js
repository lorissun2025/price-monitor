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
    return { hotspots: [] };
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
 * GET /api/hotspots
 * 获取热点列表
 */
router.get('/', (req, res) => {
  try {
    const { platform, type, city, minScore, page = 1, limit = 50 } = req.query;

    const data = getDataFile();
    let hotspots = [...data.hotspots];

    // 添加影响力等级
    hotspots = hotspots.map(h => ({
      ...h,
      influenceLevel: getInfluenceLevel(h.influenceScore)
    }));

    // 筛选
    if (platform) {
      hotspots = hotspots.filter(h => h.platform === platform);
    }

    if (type) {
      hotspots = hotspots.filter(h => h.type === type);
    }

    if (city) {
      hotspots = hotspots.filter(h => h.location.city === city);
    }

    if (minScore) {
      hotspots = hotspots.filter(h => h.influenceScore >= parseFloat(minScore));
    }

    // 分页
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginated = hotspots.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        total: hotspots.length,
        page: pageNum,
        limit: limitNum,
        hasNext: endIndex < hotspots.length,
        hotspots: paginated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取热点列表失败',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/hotspots/:id
 * 获取热点详情
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = getDataFile();

    const hotspot = data.hotspots.find(h => h.id === id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '热点不存在',
          details: `ID: ${id}`
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...hotspot,
        influenceLevel: getInfluenceLevel(hotspot.influenceScore)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取热点详情失败',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/hotspots/search
 * 搜索热点
 */
router.get('/search', (req, res) => {
  try {
    const { q, platform, type, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '缺少搜索关键词',
          details: '请提供 q 参数'
        }
      });
    }

    const data = getDataFile();
    let hotspots = [...data.hotspots];

    // 添加影响力等级
    hotspots = hotspots.map(h => ({
      ...h,
      influenceLevel: getInfluenceLevel(h.influenceScore)
    }));

    // 搜索关键词（标题、城市、作者）
    const keyword = q.toLowerCase();
    hotspots = hotspots.filter(h => {
      return (
        h.title.toLowerCase().includes(keyword) ||
        h.location.city.toLowerCase().includes(keyword) ||
        h.location.district.toLowerCase().includes(keyword) ||
        (h.metadata.author && h.metadata.author.toLowerCase().includes(keyword))
      );
    });

    // 筛选
    if (platform) {
      hotspots = hotspots.filter(h => h.platform === platform);
    }

    if (type) {
      hotspots = hotspots.filter(h => h.type === type);
    }

    // 分页
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginated = hotspots.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        total: hotspots.length,
        page: pageNum,
        limit: limitNum,
        hasNext: endIndex < hotspots.length,
        hotspots: paginated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '搜索热点失败',
        details: error.message
      }
    });
  }
});

export default router;
