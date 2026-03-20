import express from 'express';
import cors from 'cors';
import Logger from './utils/logger.js';
import requestLogger from './middleware/requestLogger.js';

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(requestLogger); // 请求日志中间件

// 热点数据存储（内存中）
let hotspots = [];

// 初始化模拟数据
function initMockData() {
  Logger.debug('开始初始化热点数据');

  hotspots = [
    // ========== 小红书 ==========
    {
      id: 'xhs_001',
      platform: 'xiaohongshu',
      title: '三里屯网红咖啡厅，必打卡！',
      type: 'food',
      influenceScore: 0.85,
      location: { lat: 39.9370, lng: 116.4477, city: '北京', district: '朝阳区' },
      metrics: { likes: 15000, collects: 8000, shares: 2000 },
      metadata: { author: '美食小当家', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'xhs_002',
      platform: 'xiaohongshu',
      title: '外滩夜景打卡点，绝美视角',
      type: 'tourism',
      influenceScore: 0.72,
      location: { lat: 31.2304, lng: 121.4737, city: '上海', district: '黄浦区' },
      metrics: { likes: 12000, collects: 6500, shares: 1500 },
      metadata: { author: '旅行达人', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'xhs_003',
      platform: 'xiaohongshu',
      title: '成都太古里火锅，排队也要吃',
      type: 'food',
      influenceScore: 0.68,
      location: { lat: 30.6586, lng: 104.0648, city: '成都', district: '锦江区' },
      metrics: { likes: 9800, collects: 5200, shares: 1200 },
      metadata: { author: '火锅爱好者', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'xhs_004',
      platform: 'xiaohongshu',
      title: '西湖断桥拍照攻略',
      type: 'tourism',
      influenceScore: 0.61,
      location: { lat: 30.2578, lng: 120.1536, city: '杭州', district: '西湖区' },
      metrics: { likes: 8500, collects: 4200, shares: 900 },
      metadata: { author: '西湖攻略', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'xhs_005',
      platform: 'xiaohongshu',
      title: '深圳湾公园骑行路线',
      type: 'tourism',
      influenceScore: 0.55,
      location: { lat: 22.4917, lng: 113.9590, city: '深圳', district: '南山区' },
      metrics: { likes: 7200, collects: 3800, shares: 800 },
      metadata: { author: '骑行达人', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'xhs_006',
      platform: 'xiaohongshu',
      title: '重庆洪崖洞夜景，太美了',
      type: 'tourism',
      influenceScore: 0.52,
      location: { lat: 29.5647, lng: 106.5507, city: '重庆', district: '渝中区' },
      metrics: { likes: 6800, collects: 3500, shares: 750 },
      metadata: { author: '重庆探店', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'xhs_007',
      platform: 'xiaohongshu',
      title: '武汉户部巷美食推荐',
      type: 'food',
      influenceScore: 0.48,
      location: { lat: 30.5901, lng: 114.2734, city: '武汉', district: '武昌区' },
      metrics: { likes: 6200, collects: 3100, shares: 680 },
      metadata: { author: '武汉美食', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },

    // ========== 微博 ==========
    {
      id: 'wb_001',
      platform: 'weibo',
      title: '北京国际电影节今日开幕',
      type: 'event',
      influenceScore: 0.88,
      location: { lat: 39.9159, lng: 116.3969, city: '北京', district: '朝阳区' },
      metrics: { likes: 25000, shares: 12000, comments: 5000 },
      metadata: { author: '微博热点', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'wb_002',
      platform: 'weibo',
      title: '上海地铁新线即将开通',
      type: 'social',
      influenceScore: 0.76,
      location: { lat: 31.2304, lng: 121.4737, city: '上海', district: '浦东新区' },
      metrics: { likes: 18000, shares: 8000, comments: 3500 },
      metadata: { author: '上海发布', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'wb_003',
      platform: 'weibo',
      title: '广州塔灯光秀时间公布',
      type: 'event',
      influenceScore: 0.63,
      location: { lat: 23.1291, lng: 113.2644, city: '广州', district: '海珠区' },
      metrics: { likes: 12000, shares: 6000, comments: 2800 },
      metadata: { author: '广州生活', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'wb_004',
      platform: 'weibo',
      title: '深圳地铁新线规划公示',
      type: 'social',
      influenceScore: 0.58,
      location: { lat: 22.5431, lng: 114.0579, city: '深圳', district: '福田区' },
      metrics: { likes: 9500, shares: 4800, comments: 2200 },
      metadata: { author: '深圳交通', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'wb_005',
      platform: 'weibo',
      title: '杭州亚运会倒计时100天',
      type: 'event',
      influenceScore: 0.52,
      location: { lat: 30.2741, lng: 120.1551, city: '杭州', district: '萧山区' },
      metrics: { likes: 8200, shares: 4100, comments: 1900 },
      metadata: { author: '亚运官方', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'wb_006',
      platform: 'weibo',
      title: '成都大熊猫基地新馆开放',
      type: 'tourism',
      influenceScore: 0.48,
      location: { lat: 30.7362, lng: 104.1459, city: '成都', district: '成华区' },
      metrics: { likes: 7500, shares: 3800, comments: 1700 },
      metadata: { author: '成都文旅', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'wb_007',
      platform: 'weibo',
      title: '武汉东湖樱花开',
      type: 'tourism',
      influenceScore: 0.45,
      location: { lat: 30.5519, lng: 114.3931, city: '武汉', district: '武昌区' },
      metrics: { likes: 6800, shares: 3400, comments: 1500 },
      metadata: { author: '武汉赏花', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },

    // ========== 抖音 ==========
    {
      id: 'dy_001',
      platform: 'douyin',
      title: '故宫夜景vlog',
      type: 'tourism',
      influenceScore: 0.91,
      location: { lat: 39.9163, lng: 116.3972, city: '北京', district: '东城区' },
      metrics: { likes: 32000, shares: 18000, comments: 8000 },
      metadata: { author: '旅行vlog', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'dy_002',
      platform: 'douyin',
      title: '网红火锅测评',
      type: 'food',
      influenceScore: 0.78,
      location: { lat: 29.4316, lng: 106.9123, city: '重庆', district: '渝中区' },
      metrics: { likes: 24000, shares: 12000, comments: 5500 },
      metadata: { author: '美食测评', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'dy_003',
      platform: 'douyin',
      title: '外滩灯光秀',
      type: 'tourism',
      influenceScore: 0.71,
      location: { lat: 31.2397, lng: 121.4998, city: '上海', district: '黄浦区' },
      metrics: { likes: 19000, shares: 9500, comments: 4200 },
      metadata: { author: '上海打卡', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'dy_004',
      platform: 'douyin',
      title: '成都街头美食',
      type: 'food',
      influenceScore: 0.65,
      location: { lat: 30.5728, lng: 104.0668, city: '成都', district: '锦江区' },
      metrics: { likes: 16000, shares: 8000, comments: 3600 },
      metadata: { author: '成都街头', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'dy_005',
      platform: 'douyin',
      title: '深圳科技园航拍',
      type: 'social',
      influenceScore: 0.58,
      location: { lat: 22.5333, lng: 113.9417, city: '深圳', district: '南山区' },
      metrics: { likes: 13000, shares: 6500, comments: 2900 },
      metadata: { author: '深圳航拍', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'dy_006',
      platform: 'douyin',
      title: '西湖荷花盛开',
      type: 'tourism',
      influenceScore: 0.52,
      location: { lat: 30.2500, lng: 120.1500, city: '杭州', district: '西湖区' },
      metrics: { likes: 11000, shares: 5500, comments: 2400 },
      metadata: { author: '杭州美景', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },

    // ========== B站 ==========
    {
      id: 'bili_001',
      platform: 'bilibili',
      title: '北京漫展现场vlog',
      type: 'acg',
      influenceScore: 0.86,
      location: { lat: 39.9388, lng: 116.3974, city: '北京', district: '朝阳区' },
      metrics: { likes: 22000, shares: 11000, coins: 5000, favorites: 3000 },
      metadata: { author: '漫展记录', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'bili_002',
      platform: 'bilibili',
      title: '上海Cosplay大赛',
      type: 'acg',
      influenceScore: 0.74,
      location: { lat: 31.2179, lng: 121.4609, city: '上海', district: '浦东新区' },
      metrics: { likes: 17000, shares: 8500, coins: 3800, favorites: 2200 },
      metadata: { author: 'Cosplay现场', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'bili_003',
      platform: 'bilibili',
      title: '广州动漫展攻略',
      type: 'acg',
      influenceScore: 0.66,
      location: { lat: 23.1291, lng: 113.2644, city: '广州', district: '天河区' },
      metrics: { likes: 14000, shares: 7000, coins: 3200, favorites: 1900 },
      metadata: { author: '动漫展攻略', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'bili_004',
      platform: 'bilibili',
      title: '深圳游戏展',
      type: 'acg',
      influenceScore: 0.59,
      location: { lat: 22.5431, lng: 114.0579, city: '深圳', district: '福田区' },
      metrics: { likes: 11000, shares: 5500, coins: 2500, favorites: 1500 },
      metadata: { author: '游戏展记录', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'bili_005',
      platform: 'bilibili',
      title: '成都漫展',
      type: 'acg',
      influenceScore: 0.54,
      location: { lat: 30.6586, lng: 104.0648, city: '成都', district: '成华区' },
      metrics: { likes: 9500, shares: 4700, coins: 2100, favorites: 1300 },
      metadata: { author: '成都ACG', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    },
    {
      id: 'bili_006',
      platform: 'bilibili',
      title: '杭州电竞比赛',
      type: 'event',
      influenceScore: 0.50,
      location: { lat: 30.2741, lng: 120.1551, city: '杭州', district: '滨江区' },
      metrics: { likes: 8800, shares: 4400, coins: 2000, favorites: 1200 },
      metadata: { author: '电竞比赛', publishTime: new Date().toISOString(), fetchTime: new Date().toISOString() }
    }
  ];

  Logger.info('📊 热点数据初始化完成', { total: hotspots.length });
}

// 初始化数据
initMockData();

// ============ API 路由 ============

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '热点地图 API 运行正常',
    timestamp: new Date().toISOString()
  });
});

// 获取热点列表
app.get('/api/hotspots', (req, res) => {
  const {
    platform,
    type,
    city,
    minScore,
    maxScore,
    limit = 30,
    offset = 0
  } = req.query;

  let filtered = [...hotspots];

  // 筛选
  if (platform) {
    filtered = filtered.filter(h => h.platform === platform);
  }

  if (type) {
    filtered = filtered.filter(h => h.type === type);
  }

  if (city) {
    filtered = filtered.filter(h => h.location.city === city);
  }

  if (minScore) {
    filtered = filtered.filter(h => h.influenceScore >= parseFloat(minScore));
  }

  if (maxScore) {
    filtered = filtered.filter(h => h.influenceScore <= parseFloat(maxScore));
  }

  // 按影响力排序
  filtered.sort((a, b) => b.influenceScore - a.influenceScore);

  // 分页
  const total = filtered.length;
  const paginated = filtered.slice(
    parseInt(offset),
    parseInt(offset) + parseInt(limit)
  );

  res.json({
    success: true,
    data: {
      hotspots: paginated,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

// 获取热点详情
app.get('/api/hotspots/:id', (req, res) => {
  const { id } = req.params;
  const hotspot = hotspots.find(h => h.id === id);

  if (!hotspot) {
    return res.status(404).json({
      success: false,
      error: { message: '热点不存在' }
    });
  }

  res.json({
    success: true,
    data: hotspot
  });
});

// 搜索热点
app.get('/api/hotspots/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: { message: '搜索关键词不能为空' }
    });
  }

  const keyword = q.toLowerCase();
  const results = hotspots.filter(h =>
    h.title.toLowerCase().includes(keyword) ||
    h.location.city.toLowerCase().includes(keyword) ||
    h.location.district.toLowerCase().includes(keyword) ||
    h.metadata.author.toLowerCase().includes(keyword)
  );

  // 按影响力排序
  results.sort((a, b) => b.influenceScore - a.influenceScore);

  res.json({
    success: true,
    data: {
      hotspots: results,
      total: results.length
    }
  });
});

// 获取统计数据
app.get('/api/stats', (req, res) => {
  const platformStats = {};
  const typeStats = {};
  const cityStats = {};

  hotspots.forEach(h => {
    // 平台统计
    platformStats[h.platform] = (platformStats[h.platform] || 0) + 1;

    // 类型统计
    typeStats[h.type] = (typeStats[h.type] || 0) + 1;

    // 城市统计
    cityStats[h.location.city] = (cityStats[h.location.city] || 0) + 1;
  });

  // 平均影响力
  const avgInfluence = hotspots.reduce((sum, h) => sum + h.influenceScore, 0) / hotspots.length;

  res.json({
    success: true,
    data: {
      total: hotspots.length,
      avgInfluence: avgInfluence.toFixed(2),
      platforms: platformStats,
      types: typeStats,
      cities: cityStats
    }
  });
});

// 触发数据抓取（模拟）
app.post('/api/fetch', (req, res) => {
  const taskId = `task_${Date.now()}`;

  // 模拟异步任务
  setTimeout(() => {
    Logger.debug('数据抓取任务完成', { taskId });
  }, 2000);

  res.json({
    success: true,
    taskId,
    message: '数据抓取任务已启动',
    estimatedTime: 2
  });
});

// 获取抓取任务状态（模拟）
app.get('/api/fetch/status/:taskId', (req, res) => {
  const { taskId } = req.params;

  res.json({
    success: true,
    data: {
      taskId,
      status: 'completed',
      progress: 100,
      message: '数据抓取完成',
      fetched: hotspots.length
    }
  });
});

// 添加新热点（管理功能）
app.post('/api/hotspots', (req, res) => {
  const hotspot = req.body;

  if (!hotspot.title || !hotspot.location || !hotspot.location.lat || !hotspot.location.lng) {
    return res.status(400).json({
      success: false,
      error: { message: '缺少必要字段' }
    });
  }

  const newHotspot = {
    id: `${hotspot.platform || 'custom'}_${Date.now()}`,
    platform: hotspot.platform || 'custom',
    title: hotspot.title,
    type: hotspot.type || 'social',
    influenceScore: hotspot.influenceScore || 0.5,
    location: hotspot.location,
    metrics: hotspot.metrics || { likes: 0, shares: 0 },
    metadata: {
      ...hotspot.metadata,
      publishTime: hotspot.metadata?.publishTime || new Date().toISOString(),
      fetchTime: new Date().toISOString()
    }
  };

  hotspots.push(newHotspot);

  res.json({
    success: true,
    data: newHotspot,
    message: '热点添加成功'
  });
});

// 更新热点（管理功能）
app.put('/api/hotspots/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const index = hotspots.findIndex(h => h.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { message: '热点不存在' }
    });
  }

  hotspots[index] = { ...hotspots[index], ...updates };

  res.json({
    success: true,
    data: hotspots[index],
    message: '热点更新成功'
  });
});

// 删除热点（管理功能）
app.delete('/api/hotspots/:id', (req, res) => {
  const { id } = req.params;
  const index = hotspots.findIndex(h => h.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { message: '热点不存在' }
    });
  }

  hotspots.splice(index, 1);

  res.json({
    success: true,
    message: '热点删除成功'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  Logger.error('服务器错误', err);
  res.status(500).json({
    success: false,
    error: { message: '服务器内部错误' }
  });
});

// 启动服务器
app.listen(PORT, () => {
  Logger.info(`🚀 热点地图 API 服务器运行在 http://localhost:${PORT}`);
  Logger.debug('API 端点列表', {
    endpoints: [
      'GET  /api/health',
      'GET  /api/hotspots',
      'GET  /api/hotspots/:id',
      'GET  /api/hotspots/search',
      'GET  /api/stats',
      'POST /api/fetch',
      'POST /api/hotspots',
      'PUT  /api/hotspots/:id',
      'DELETE /api/hotspots/:id'
    ]
  });
});
