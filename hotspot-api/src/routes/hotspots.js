const express = require('express');
const router = express.Router();
const { query, run } = require('../database/db');

// GET /api/hotspots - 获取热点列表
router.get('/', async (req, res) => {
  try {
    const {
      platform,
      type,
      city,
      minInfluence,
      maxInfluence,
      startTime,
      endTime,
      page = 1,
      pageSize = 20
    } = req.query;

    // 构建 WHERE 条件
    const conditions = [];
    const params = [];

    if (platform) {
      const platforms = Array.isArray(platform) ? platform : [platform];
      conditions.push(`platform IN (${platforms.map(() => '?').join(',')})`);
      params.push(...platforms);
    }

    if (type) {
      const types = Array.isArray(type) ? type : [type];
      conditions.push(`type IN (${types.map(() => '?').join(',')})`);
      params.push(...types);
    }

    if (city) {
      conditions.push('city = ?');
      params.push(city);
    }

    if (minInfluence) {
      conditions.push('influence_score >= ?');
      params.push(parseFloat(minInfluence));
    }

    if (maxInfluence) {
      conditions.push('influence_score <= ?');
      params.push(parseFloat(maxInfluence));
    }

    if (startTime) {
      conditions.push('publish_time >= ?');
      params.push(startTime);
    }

    if (endTime) {
      conditions.push('publish_time <= ?');
      params.push(endTime);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM hotspots ${whereClause}`;
    const countResult = await get(countSql, params);
    const total = countResult.total;

    // 查询数据
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT * FROM hotspots
      ${whereClause}
      ORDER BY influence_score DESC, publish_time DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(pageSize), offset);

    const hotspots = await query(dataSql, params);

    res.json({
      code: 200,
      message: 'success',
      data: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize),
        hotspots
      }
    });
  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// GET /api/hotspots/:id - 获取热点详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = 'SELECT * FROM hotspots WHERE id = ?';
    const hotspot = await get(sql, [id]);

    if (!hotspot) {
      return res.status(404).json({
        code: 404,
        message: 'Hotspot not found'
      });
    }

    // 获取趋势数据
    const trendsSql = `
      SELECT score, timestamp
      FROM hotspot_trends
      WHERE hotspot_id = ?
      ORDER BY timestamp ASC
      LIMIT 168
    `;
    const trends = await query(trendsSql, [id]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...hotspot,
        trends: trends.map(t => ({
          score: t.score,
          timestamp: t.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching hotspot:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// GET /api/hotspots/:id/trends - 获取趋势数据
router.get('/:id/trends', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT score, timestamp
      FROM hotspot_trends
      WHERE hotspot_id = ?
      ORDER BY timestamp ASC
    `;
    const trends = await query(sql, [id]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        hotspot_id: id,
        hourlyScores: trends.map(t => t.score),
        timestamps: trends.map(t => t.timestamp)
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// GET /api/hotspots/stats - 获取统计信息
router.get('/stats', async (req, res) => {
  try {
    // 总数
    const totalSql = 'SELECT COUNT(*) as total FROM hotspots';
    const totalResult = await get(totalSql, []);

    // 按平台统计
    const byPlatformSql = `
      SELECT platform, COUNT(*) as count
      FROM hotspots
      GROUP BY platform
    `;
    const byPlatform = await query(byPlatformSql, []);

    // 按类型统计
    const byTypeSql = `
      SELECT type, COUNT(*) as count
      FROM hotspots
      GROUP BY type
    `;
    const byType = await query(byTypeSql, []);

    // 按城市统计
    const byCitySql = `
      SELECT city, COUNT(*) as count
      FROM hotspots
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `;
    const byCity = await query(byCitySql, []);

    // 影响力分布
    const influenceSql = `
      SELECT
        SUM(CASE WHEN influence_score > 0.8 THEN 1 ELSE 0 END) as very_high,
        SUM(CASE WHEN influence_score >= 0.6 AND influence_score <= 0.8 THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN influence_score >= 0.4 AND influence_score < 0.6 THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN influence_score >= 0.2 AND influence_score < 0.4 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN influence_score < 0.2 THEN 1 ELSE 0 END) as emerging
      FROM hotspots
    `;
    const influence = await get(influenceSql, []);

    // 平均影响力
    const avgInfluenceSql = 'SELECT AVG(influence_score) as avg_influence FROM hotspots';
    const avgInfluence = await get(avgInfluenceSql, []);

    res.json({
      code: 200,
      message: 'success',
      data: {
        total: totalResult.total,
        avgInfluence: avgInfluence.avg_influence,
        byPlatform: Object.fromEntries(byPlatform.map(p => [p.platform, p.count])),
        byType: Object.fromEntries(byType.map(t => [t.type, t.count])),
        byCity: Object.fromEntries(byCity.map(c => [c.city, c.count])),
        influenceDistribution: {
          very_high: influence.very_high,
          high: influence.high,
          medium: influence.medium,
          low: influence.low,
          emerging: influence.emerging
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

module.exports = router;
