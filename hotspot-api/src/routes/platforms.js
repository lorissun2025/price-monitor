const express = require('express');
const router = express.Router();
const { query, get } = require('../database/db');

// GET /api/platforms - 获取支持的平台列表
router.get('/', (req, res) => {
  try {
    const platforms = [
      { id: 'xiaohongshu', name: '小红书', icon: '📕' },
      { id: 'weibo', name: '微博', icon: '📟' },
      { id: 'douyin', name: '抖音', icon: '🎵' },
      { id: 'bilibili', name: 'B站', icon: '📺️' }
    ];

    res.json({
      code: 200,
      message: 'success',
      data: platforms
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// GET /api/platforms/:id/stats - 获取平台统计
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const countSql = 'SELECT COUNT(*) as total FROM hotspots WHERE platform = ?';
    const countResult = await get(countSql, [id]);

    const avgInfluenceSql = 'SELECT AVG(influence_score) as avg_influence FROM hotspots WHERE platform = ?';
    const avgInfluence = await get(avgInfluenceSql, [id]);

    const hotTopicsSql = `
      SELECT title, influence_score
      FROM hotspots
      WHERE platform = ?
      ORDER BY influence_score DESC
      LIMIT 10
    `;
    const hotTopics = await query(hotTopicsSql, [id]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        platform: id,
        total: countResult.total,
        avgInfluence: avgInfluence.avg_influence,
        hotTopics: hotTopics.map(t => ({
          title: t.title,
          influenceScore: t.influence_score
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

module.exports = router;
