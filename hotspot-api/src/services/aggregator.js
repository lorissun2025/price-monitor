const { query, run } = require('../database/db');

// 平台类型枚举
const Platform = {
  XIAOHONGSHU: 'xiaohongshu',
  WEIBO: 'weibo',
  DOUYIN: 'douyin',
  BILIBILI: 'bilibili'
};

// 热点类型枚举
const HotspotType = {
  FOOD: 'food',
  TOURISM: 'tourism',
  EVENT: 'event',
  ACG: 'acg',
  SOCIAL_TREND: 'social_trend',
  OTHER: 'other'
};

// 模拟数据生成器（用于演示）
class MockDataAggregator {
  constructor() {
    this.cities = [
      { name: '北京', lat: 39.9042, lng: 116.4074 },
      { name: '上海', lat: 31.2304, lng: 121.4737 },
      { name: '广州', lat: 23.1291, lng: 113.2644 },
      { name: '深圳', lat: 22.5431, lng: 114.0579 },
      { name: '成都', lat: 30.5728, lng: 104.0668 },
      { name: '杭州', lat: 30.2741, lng: 120.1551 },
      { name: '西安', lat: 34.3416, lng: 108.9398 },
      { name: '武汉', lat: 30.5928, lng: 114.3055 },
      { name: '南京', lat: 32.0603, lng: 118.7969 },
      { name: '重庆', lat: 29.4316, lng: 106.9123 }
    ];

    this.titles = {
      [HotspotType.FOOD]: [
        '网红火锅店排长队', '米其林餐厅新店开业', '特色小吃火爆打卡',
        '咖啡厅成热门去处', '甜品店排队三小时', '日料自助爆满'
      ],
      [HotspotType.TOURISM]: [
        '故宫樱花季人山人海', '外滩夜景最美', '西湖断桥人潮涌动',
        '长城日落打卡点', '黄山云海壮观', '九寨沟水色惊艳'
      ],
      [HotspotType.EVENT]: [
        '动漫展门票秒光', '音乐节阵容官宣', '马拉松报名爆满',
        '书展大咖云集', '科技展新品发布', '艺术展开幕'
      ],
      [HotspotType.ACG]: [
        '新番开播热度爆表', '游戏皮肤限定上架', '漫展 Cosplay 集体',
        '虚拟主播爆火', '手办新品发售', '电竞比赛决赛'
      ],
      [HotspotType.SOCIAL_TREND]: [
        '社会事件引发热议', '明星恋情官宣', '网络流行语诞生',
        '公益项目启动', '文化传承活动', '科技创新突破'
      ]
    };
  }

  // 生成模拟热点数据
  generateMockHotspots(count = 50) {
    const hotspots = [];
    const platforms = Object.values(Platform);
    const types = Object.values(HotspotType);

    for (let i = 0; i < count; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const city = this.cities[Math.floor(Math.random() * this.cities.length)];
      const titles = this.titles[type];
      const title = titles[Math.floor(Math.random() * titles.length)];

      const hotspot = {
        id: `${platform}_${type}_${Date.now()}_${i}`,
        platform,
        title: `${city.name}·${title}`,
        content: `这是一个来自${platform}的热点内容，位于${city.name}`,
        type,
        location: {
          lat: city.lat + (Math.random() - 0.5) * 0.1,
          lng: city.lng + (Math.random() - 0.5) * 0.1,
          city: city.name,
          district: ['朝阳区', '浦东新区', '天河区', '福田区'][Math.floor(Math.random() * 4)],
          address: `${city.name}市中心`
        },
        metrics: {
          likes: Math.floor(Math.random() * 100000) + 1000,
          collects: Math.floor(Math.random() * 50000) + 500,
          views: Math.floor(Math.random() * 1000000) + 10000,
          shares: Math.floor(Math.random() * 10000) + 100,
          comments: Math.floor(Math.random() * 5000) + 50
        },
        metadata: {
          author: ['美食小当家', '旅游达人', 'ACG爱好者', '新闻观察员'][Math.floor(Math.random() * 4)],
          author_id: `user_${Math.floor(Math.random() * 10000)}`,
          category: type,
          tags: [type, platform, 'hotspot'],
          publishTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          fetchTime: new Date().toISOString(),
          url: `https://example.com/hotspot/${i}`
        }
      };

      // 计算影响力评分
      hotspot.influenceScore = this.calculateInfluenceScore(hotspot);
      hotspot.influenceLevel = this.getInfluenceLevel(hotspot.influenceScore);

      // 转换为数据库格式
      hotspots.push(this.formatForDatabase(hotspot));
    }

    return hotspots;
  }

  // 计算影响力评分
  calculateInfluenceScore(hotspot) {
    const { metrics, metadata } = hotspot;

    // 传播度得分
    const normalizedViews = Math.min(metrics.views / 1000000, 1);
    const normalizedLikes = Math.min(metrics.likes / 100000, 1);
    const normalizedCollects = Math.min(metrics.collects / 50000, 1);
    const spreadScore = normalizedViews * 0.4 + normalizedLikes * 0.4 + normalizedCollects * 0.2;

    // 讨论度得分
    const normalizedComments = Math.min(metrics.comments / 10000, 1);
    const normalizedShares = Math.min(metrics.shares / 5000, 1);
    const discussScore = normalizedComments * 0.5 + normalizedShares * 0.5;

    // 时效性得分（指数衰减）
    const now = new Date();
    const publishTime = new Date(metadata.publishTime);
    const hoursPassed = (now - publishTime) / (1000 * 60 * 60);
    const halfLife = 24;
    const timeScore = Math.pow(0.5, hoursPassed / halfLife);

    // 综合评分
    const weights = { spread: 0.5, discuss: 0.3, time: 0.2 };
    const finalScore = spreadScore * weights.spread + discussScore * weights.discuss + timeScore * weights.time;

    return Math.min(Math.max(finalScore, 0), 1);
  }

  // 获取影响力等级
  getInfluenceLevel(score) {
    if (score > 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'emerging';
  }

  // 格式化为数据库格式
  formatForDatabase(hotspot) {
    return {
      id: hotspot.id,
      platform: hotspot.platform,
      title: hotspot.title,
      content: hotspot.content,
      type: hotspot.type,
      lat: hotspot.location.lat,
      lng: hotspot.location.lng,
      city: hotspot.location.city,
      district: hotspot.location.district,
      address: hotspot.location.address,
      influence_score: hotspot.influenceScore,
      influence_level: hotspot.influenceLevel,
      likes: hotspot.metrics.likes,
      collects: hotspot.metrics.collects,
      views: hotspot.metrics.views,
      shares: hotspot.metrics.shares,
      comments: hotspot.metrics.comments,
      author: hotspot.metadata.author,
      author_id: hotspot.metadata.author_id,
      category: hotspot.metadata.category,
      tags: hotspot.metadata.tags.join(','),
      publish_time: hotspot.metadata.publishTime,
      fetch_time: hotspot.metadata.fetchTime,
      url: hotspot.metadata.url
    };
  }
}

// 数据聚合服务
class AggregatorService {
  constructor() {
    this.mockAggregator = new MockDataAggregator();
  }

  // 聚合所有平台的热点
  async aggregateAllHotspots() {
    console.log('🔍 开始聚合热点数据...');

    try {
      // 生成模拟数据（实际应从各平台 API 获取）
      const mockHotspots = this.mockAggregator.generateMockHotspots(100);

      // 保存到数据库
      for (const hotspot of mockHotspots) {
        const sql = `
          INSERT OR REPLACE INTO hotspots (
            id, platform, title, content, type, lat, lng, city, district, address,
            influence_score, influence_level, likes, collects, views, shares, comments,
            author, author_id, category, tags, publish_time, fetch_time, url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await run(sql, [
          hotspot.id, hotspot.platform, hotspot.title, hotspot.content, hotspot.type,
          hotspot.lat, hotspot.lng, hotspot.city, hotspot.district, hotspot.address,
          hotspot.influence_score, hotspot.influence_level, hotspot.likes,
          hotspot.collects, hotspot.views, hotspot.shares, hotspot.comments,
          hotspot.author, hotspot.author_id, hotspot.category, hotspot.tags,
          hotspot.publish_time, hotspot.fetch_time, hotspot.url
        ]);
      }

      console.log(`✅ 成功聚合 ${mockHotspots.length} 个热点`);
      return mockHotspots;
    } catch (error) {
      console.error('❌ 聚合热点失败:', error);
      throw error;
    }
  }

  // 聚合特定平台的热点
  async aggregateByPlatform(platform) {
    console.log(`🔍 聚合 ${platform} 平台的热点...`);

    try {
      const mockHotspots = this.mockAggregator.generateMockHotspots(25);
      const platformHotspots = mockHotspots.filter(h => h.platform === platform);

      for (const hotspot of platformHotspots) {
        const sql = `
          INSERT OR REPLACE INTO hotspots (
            id, platform, title, content, type, lat, lng, city, district, address,
            influence_score, influence_level, likes, collects, views, shares, comments,
            author, author_id, category, tags, publish_time, fetch_time, url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await run(sql, [
          hotspot.id, hotspot.platform, hotspot.title, hotspot.content, hotspot.type,
          hotspot.lat, hotspot.lng, hotspot.city, hotspot.district, hotspot.address,
          hotspot.influence_score, hotspot.influence_level, hotspot.likes,
          hotspot.collects, hotspot.views, hotspot.shares, hotspot.comments,
          hotspot.author, hotspot.author_id, hotspot.category, hotspot.tags,
          hotspot.publish_time, hotspot.fetch_time, hotspot.url
        ]);
      }

      console.log(`✅ 成功聚合 ${platformHotspots.length} 个 ${platform} 热点`);
      return platformHotspots;
    } catch (error) {
      console.error(`❌ 聚合 ${platform} 热点失败:`, error);
      throw error;
    }
  }
}

module.exports = {
  AggregatorService,
  Platform,
  HotspotType
};
