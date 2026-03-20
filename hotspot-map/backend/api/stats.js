/**
 * 统计 API 路由
 * 提供统计数据接口
 */

import express from 'express';
import db from '../database/db.js';

const router = express.Router();

/**
 * GET /api/stats
 * 获取整体统计信息
 */
router.get('/', (req, res) => {
  try {
    // 总热点数
    const total = db.get('SELECT COUNT(*) as count FROM hotspots').count;

    // 按类型统计
    const byType = db.all(`
      SELECT type, COUNT(*) as count
      FROM hotspots
      GROUP BY type
      ORDER BY count DESC
    `);

    // 按平台统计
    const byPlatform = db.all(`
      SELECT platform, COUNT(*) as count
      FROM hotspots
      GROUP BY platform
      ORDER BY count DESC
    `);

    // 影响力分布
    const influenceStats = db.all(`
      SELECT
        CASE
          WHEN influence >= 0.8 THEN '极高'
          WHEN influence >= 0.6 THEN '高'
          WHEN influence >= 0.4 THEN '中'
          WHEN influence >= 0.2 THEN '低'
          ELSE '新'
        END as level,
        COUNT(*) as count
      FROM hotspots
      GROUP BY level
      ORDER BY influence DESC
    `);

    // 最新更新时间
    const lastUpdate = db.get(`
      SELECT MAX(updated_at) as last_update
      FROM hotspots
    `);

    // 热点增长趋势（最近 7 天）
    const dailyGrowth = db.all(`
      SELECT
        DATE(created_at, 'unixepoch') as date,
        COUNT(*) as count
      FROM hotspots
      WHERE created_at > datetime('now', '-7 days')
      GROUP BY date
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: {
        total,
        byType,
        byPlatform,
        influence: influenceStats,
        lastUpdate: lastUpdate?.last_update || null,
        dailyGrowth
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/stats/hotspot/:id
 * 获取单个热点的统计信息
 */
router.get('/hotspot/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 基础信息
    const hotspot = db.get(
      'SELECT * FROM hotspots WHERE id = ?',
      [id]
    );

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `热点 ${id} 不存在`
      });
    }

    // 历史数据
    const history = db.all(
      `SELECT
        timestamp,
        views,
        likes,
        comments,
        shares,
        influence
       FROM hotspot_history
       WHERE hotspot_id = ?
       ORDER BY timestamp DESC
       LIMIT 168`,
      [id]
    );

    // 计算增长率
    if (history.length > 1) {
      const latest = history[0];
      const earliest = history[history.length - 1];

      hotspot.viewsGrowth = latest.views !== 0
        ? ((latest.views - earliest.views) / earliest.views * 100).toFixed(2)
        : 'N/A';

      hotspot.influenceGrowth = latest.influence !== 0
        ? ((latest.influence - earliest.influence) / earliest.influence * 100).toFixed(2)
        : 'N/A';
    }

    // 同类热点排名
    const ranking = db.get(`
      SELECT
        COUNT(*) as rank
      FROM hotspots
      WHERE type = ? AND influence > ?
    `, [hotspot.type, hotspot.influence]);

    res.json({
      success: true,
      data: {
        hotspot,
        history,
        ranking: ranking?.rank + 1,
        sameTypeCount: db.get(
          'SELECT COUNT(*) as count FROM hotspots WHERE type = ?',
          [hotspot.type]
        ).count
      }
    });
  } catch (error) {
    console.error('获取热点统计失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/stats/trends
 * 获取趋势分析数据
 */
router.get('/trends', (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = Number(days);

    // 按类型趋势
    const typeTrends = db.all(`
      SELECT
        type,
        DATE(created_at, 'unixepoch') as date,
        COUNT(*) as count,
        AVG(influence) as avgInfluence
      FROM hotspots
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY type, date
      ORDER BY type, date
    `);

    // 按平台趋势
    const platformTrends = db.all(`
      SELECT
        platform,
        DATE(created_at, 'unixepoch') as date,
        COUNT(*) as count,
        AVG(influence) as avgInfluence
      FROM hotspots
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY platform, date
      ORDER BY platform, date
    `);

    // 增长率最高的热点
    const topGrowing = db.all(`
      SELECT * FROM hotspots
      WHERE growth > 0
      ORDER BY growth DESC
      LIMIT 10
    `);

    // 影响力最高的热点
    const topInfluence = db.all(`
      SELECT * FROM hotspots
      ORDER BY influence DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        period: `${days}d`,
        typeTrends,
        platformTrends,
        topGrowing,
        topInfluence
      }
    });
  } catch (error) {
    console.error('获取趋势分析失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
