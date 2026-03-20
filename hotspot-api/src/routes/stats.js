const express = require('express');
const router = express.Router();

// GET /api/stats - 综合统计
router.get('/', async (req, res) => {
  try {
    // 这个路由是热点的子路由，已经实现在 hotspots.js 中的 /stats
    // 这里重定向到正确的路由
    res.redirect('/api/hotspots/stats');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

// GET /api/stats/realtime - 实时统计（v2.0 功能预留）
router.get('/realtime', (req, res) => {
  try {
    res.json({
      code: 200,
      message: 'success',
      data: {
        status: 'not_implemented',
        message: 'Realtime statistics will be available in v2.0'
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error: error.message
    });
  }
});

module.exports = router;
