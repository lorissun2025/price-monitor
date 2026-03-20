/**
 * 热点 API 路由
 * 提供 CRUD 和查询接口
 */

import express from 'express';
import db from '../database/db.js';

const router = express.Router();

/**
 * GET /api/hotspots
 * 获取所有热点（支持筛选和分页）
 */
router.get('/', (req, res) => {
  try {
    const { type, platform, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM hotspots WHERE 1=1';
    const params = [];

    // 类型筛选
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    // 平台筛选
    if (platform) {
      sql += ' AND platform = ?';
      params.push(platform);
    }

    // 排序和分页
    sql += ' ORDER BY influence DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const hotspots = db.all(sql, params);

    res.json({
      success: true,
      data: hotspots,
      count: hotspots.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('获取热点失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/hotspots/:id
 * 获取单个热点详情
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

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

    // 获取历史数据
    const history = db.all(
      'SELECT * FROM hotspot_history WHERE hotspot_id = ? ORDER BY timestamp DESC LIMIT 168',
      [id]
    );  // 168 小时 = 7 天

    res.json({
      success: true,
      data: {
        ...hotspot,
        history
      }
    });
  } catch (error) {
    console.error('获取热点详情失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/hotspots/trending
 * 获取趋势热点（按增长率排序）
 */
router.get('/trending', (req, res) => {
  try {
    const { hours = 24, limit = 10 } = req.query;

    const hotspots = db.all(
      `SELECT * FROM hotspots
       WHERE growth > 0
         AND created_at > datetime('now', '-${hours} hours')
       ORDER BY growth DESC
       LIMIT ?`,
      [Number(limit)]
    );

    res.json({
      success: true,
      data: hotspots,
      count: hotspots.length,
      period: `${hours}h`
    });
  } catch (error) {
    console.error('获取趋势热点失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/hotspots
 * 创建新热点（管理端）
 */
router.post('/', (req, res) => {
  try {
    const {
      id,
      title,
      description,
      type,
      platform,
      source_id,
      location_name,
      location_lat,
      location_lng,
      views,
      likes,
      comments,
      shares
    } = req.body;

    // 验证必填字段
    if (!id || !title || !type || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: '缺少必填字段: id, title, type, platform'
      });
    }

    const now = Math.floor(Date.now() / 1000);

    db.insert('hotspots', {
      id,
      title,
      description: description || null,
      type,
      platform,
      source_id: source_id || null,
      location_name: location_name || null,
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      views: views || 0,
      likes: likes || 0,
      comments: comments || 0,
      shares: shares || 0,
      influence: 0,  // 会由后端计算
      growth: 0,
      created_at: now,
      updated_at: now
    });

    res.json({
      success: true,
      message: '热点创建成功',
      data: { id }
    });
  } catch (error) {
    console.error('创建热点失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/hotspots/:id
 * 更新热点
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 检查热点是否存在
    const existing = db.get('SELECT id FROM hotspots WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `热点 ${id} 不存在`
      });
    }

    // 更新
    db.update('hotspots', id, updates);

    res.json({
      success: true,
      message: '热点更新成功',
      data: { id }
    });
  } catch (error) {
    console.error('更新热点失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/hotspots/:id
 * 删除热点
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 检查热点是否存在
    const existing = db.get('SELECT id FROM hotspots WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `热点 ${id} 不存在`
      });
    }

    // 删除
    db.delete('hotspots', id);

    res.json({
      success: true,
      message: '热点删除成功',
      data: { id }
    });
  } catch (error) {
    console.error('删除热点失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
