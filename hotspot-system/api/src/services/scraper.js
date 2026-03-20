// 数据抓取服务

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomInt } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

// 确保输出目录存在
const outputDir = join(__dirname, '../../.firecrawl');
try {
  mkdirSync(outputDir, { recursive: true });
} catch (error) {
  // 目录已存在，忽略
}

/**
 * 用 firecrawl 搜索网页
 */
async function searchWithFirecrawl(query, options = {}) {
  const {
    limit = 10,
    sources = 'web',
    timeFilter = 'qdr:d', // 过去一天
    scrape = true,
  } = options;

  const timestamp = Date.now();
  const filename = `search-${query.replace(/\s+/g, '-')}-${timestamp}.json`;
  const outputPath = join(outputDir, filename);

  try {
    const cmd = [
      'firecrawl search',
      `"${query}"`,
      `--limit ${limit}`,
      `--sources ${sources}`,
      `--tbs ${timeFilter}`,
      scrape ? '--scrape' : '',
      '-o',
      outputPath,
      '--json'
    ].filter(Boolean).join(' ');

    console.log('🔥 执行 firecrawl 搜索:', query);
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

    if (stderr && !stderr.includes('credits')) {
      console.warn('⚠️  firecrawl 警告:', stderr);
    }

    // 读取结果
    const data = JSON.parse(readFileSync(outputPath, 'utf-8'));
    console.log(`✅ 搜索完成，找到 ${data.data?.web?.length || 0} 条结果`);

    return data;
  } catch (error) {
    console.error('❌ firecrawl 搜索失败:', error.message);
    throw error;
  }
}

/**
 * 生成热点 ID
 */
function generateHotspotId(platform, index) {
  const prefixMap = {
    xiaohongshu: 'xhs',
    weibo: 'wb',
    douyin: 'dy',
    bilibili: 'bili'
  };
  return `${prefixMap[platform] || 'hs'}_${Date.now()}_${index}`;
}

/**
 * 模拟地理位置解析（真实应该调用地理编码 API）
 */
function mockGeoLocation(city) {
  const cityLocations = {
    '北京': { lat: 39.9042, lng: 116.4074, districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'] },
    '上海': { lat: 31.2304, lng: 121.4737, districts: ['黄浦区', '浦东新区', '徐汇区', '静安区'] },
    '广州': { lat: 23.1291, lng: 113.2644, districts: ['天河区', '越秀区', '海珠区', '荔湾区'] },
    '深圳': { lat: 22.5431, lng: 114.0579, districts: ['南山区', '福田区', '罗湖区', '宝安区'] },
    '杭州': { lat: 30.2741, lng: 120.1551, districts: ['西湖区', '拱墅区', '滨江区'] },
    '成都': { lat: 30.6586, lng: 104.0648, districts: ['锦江区', '武侯区', '成华区'] },
  };

  const cityData = cityLocations[city] || cityLocations['北京'];
  const district = cityData.districts[randomInt(0, cityData.districts.length)];

  // 在城市中心附近随机偏移
  const lat = cityData.lat + (Math.random() - 0.5) * 0.1;
  const lng = cityData.lng + (Math.random() - 0.5) * 0.1;

  return {
    lat: parseFloat(lat.toFixed(4)),
    lng: parseFloat(lng.toFixed(4)),
    city,
    district
  };
}

/**
 * 计算影响力评分（模拟）
 */
function calculateInfluenceScore(metrics) {
  let score = 0;

  // 基础分
  if (metrics.likes) score += Math.min(metrics.likes / 100000, 0.5);
  if (metrics.views) score += Math.min(metrics.views / 1000000, 0.5);
  if (metrics.readCount) score += Math.min(metrics.readCount / 5000000, 0.5);
  if (metrics.shares) score += Math.min(metrics.shares / 100000, 0.2);
  if (metrics.comments) score += Math.min(metrics.comments / 50000, 0.2);
  if (metrics.collects) score += Math.min(metrics.collects / 10000, 0.2);
  if (metrics.discussCount) score += Math.min(metrics.discussCount / 300000, 0.3);

  // 限制在 0-1 之间
  return Math.min(score, 1);
}

/**
 * 推断热点类型
 */
function inferHotspotType(title, description = '') {
  const text = (title + ' ' + description).toLowerCase();

  const typeKeywords = {
    food: ['美食', '餐厅', '火锅', '咖啡', '茶', '菜', '料理', '小吃', '探店'],
    tourism: ['旅游', '景点', '打卡', '攻略', '风景', '公园', '夜景', '拍照', '海滩', '山', '湖'],
    event: ['活动', '展会', '音乐节', '漫展', '节庆', '庆典', '开幕', '活动'],
    acg: ['动漫', 'cosplay', '游戏', '二次元', '漫展', 'b站', 'up主'],
    social_trend: ['热搜', '话题', '新闻', '预警', '开通', '通知', '公告', '政策']
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return type;
      }
    }
  }

  return 'other';
}

/**
 * 将 firecrawl 搜索结果转换为热点格式
 */
function convertToHotspot(result, platform, city = '北京') {
  const location = mockGeoLocation(city);

  // 生成随机指标
  const metrics = generateMetrics(platform);

  return {
    id: generateHotspotId(platform, randomInt(1000, 9999)),
    platform,
    title: result.title || result.description?.substring(0, 50) || '未知标题',
    type: inferHotspotType(result.title, result.description),
    influenceScore: calculateInfluenceScore(metrics),
    location,
    metrics,
    metadata: {
      author: result.author || generateAuthor(platform),
      url: result.url,
      description: result.description || '',
      publishTime: new Date().toISOString(),
      fetchTime: new Date().toISOString()
    }
  };
}

/**
 * 生成作者名称
 */
function generateAuthor(platform) {
  const authors = {
    xiaohongshu: ['美食小当家', '旅行达人', '生活记录者', '城市探险家', '摄影爱好者'],
    weibo: ['资讯博主', '新闻快报', '城市观察', '本地生活', '热点追踪'],
    douyin: ['探店达人', '旅行博主', '美食专家', '视频创作者', '生活分享'],
    bilibili: ['UP主小A', '游戏解说', '动画推荐', '科技评测', '生活记录']
  };

  const list = authors[platform] || authors['xiaohongshu'];
  return list[randomInt(0, list.length)];
}

/**
 * 生成随机指标数据
 */
function generateMetrics(platform) {
  const base = {
    xiaohongshu: { likes: randomInt(5000, 50000), collects: randomInt(2000, 20000) },
    weibo: { readCount: randomInt(500000, 10000000), discussCount: randomInt(10000, 500000) },
    douyin: {
      likes: randomInt(50000, 500000),
      shares: randomInt(10000, 100000),
      comments: randomInt(5000, 50000)
    },
    bilibili: {
      views: randomInt(100000, 2000000),
      likes: randomInt(10000, 200000),
      coins: randomInt(5000, 100000)
    }
  };

  return base[platform] || base['xiaohongshu'];
}

/**
 * 小红书抓取
 */
export async function fetchXiaohongshuHotspots() {
  console.log('📕 开始抓取小红书热点...');

  const queries = ['美食探店 北京', '网红打卡', '旅行攻略', '下午茶', '火锅推荐'];
  const hotspots = [];

  for (const query of queries) {
    try {
      const result = await searchWithFirecrawl(query + ' 小红书', {
        limit: 5,
        timeFilter: 'qdr:d'
      });

      if (result.data?.web) {
        for (const item of result.data.web) {
          // 随机选择城市
          const city = ['北京', '上海', '广州', '深圳', '杭州', '成都'][randomInt(0, 6)];
          hotspots.push(convertToHotspot(item, 'xiaohongshu', city));
        }
      }
    } catch (error) {
      console.error(`❌ 抓取小红书 "${query}" 失败:`, error.message);
    }
  }

  console.log(`✅ 小红书抓取完成，共 ${hotspots.length} 个热点`);
  return hotspots;
}

/**
 * 微博抓取
 */
export async function fetchWeiboHotspots() {
  console.log('📟 开始抓取微博热点...');

  const queries = ['微博热搜榜', '北京新闻', '上海交通', '深圳天气', '成都美食'];
  const hotspots = [];

  for (const query of queries) {
    try {
      const result = await searchWithFirecrawl(query + ' 微博', {
        limit: 3,
        timeFilter: 'qdr:d'
      });

      if (result.data?.web) {
        for (const item of result.data.web) {
          hotspots.push(convertToHotspot(item, 'weibo'));
        }
      }
    } catch (error) {
      console.error(`❌ 抓取微博 "${query}" 失败:`, error.message);
    }
  }

  console.log(`✅ 微博抓取完成，共 ${hotspots.length} 个热点`);
  return hotspots;
}

/**
 * 抖音抓取
 */
export async function fetchDouyinHotspots() {
  console.log('🎵 开始抓取抖音热点...');

  const queries = ['抖音热门', '网红探店', '旅行视频', '美食推荐', '城市打卡'];
  const hotspots = [];

  for (const query of queries) {
    try {
      const result = await searchWithFirecrawl(query + ' 抖音', {
        limit: 4,
        timeFilter: 'qdr:d'
      });

      if (result.data?.web) {
        for (const item of result.data.web) {
          hotspots.push(convertToHotspot(item, 'douyin'));
        }
      }
    } catch (error) {
      console.error(`❌ 抓取抖音 "${query}" 失败:`, error.message);
    }
  }

  console.log(`✅ 抖音抓取完成，共 ${hotspots.length} 个热点`);
  return hotspots;
}

/**
 * B站抓取
 */
export async function fetchBilibiliHotspots() {
  console.log('📺 开始抓取B站热点...');

  const queries = ['B站热门', '二次元', '动漫推荐', '游戏解说', '科技评测'];
  const hotspots = [];

  for (const query of queries) {
    try {
      const result = await searchWithFirecrawl(query + ' B站 bilibili', {
        limit: 3,
        timeFilter: 'qdr:d'
      });

      if (result.data?.web) {
        for (const item of result.data.web) {
          hotspots.push(convertToHotspot(item, 'bilibili'));
        }
      }
    } catch (error) {
      console.error(`❌ 抓取B站 "${query}" 失败:`, error.message);
    }
  }

  console.log(`✅ B站抓取完成，共 ${hotspots.length} 个热点`);
  return hotspots;
}

/**
 * 抓取所有平台数据
 */
export async function fetchAllHotspots() {
  console.log('🚀 开始抓取所有平台数据...\n');

  const startTime = Date.now();

  const results = await Promise.allSettled([
    fetchXiaohongshuHotspots(),
    fetchWeiboHotspots(),
    fetchDouyinHotspots(),
    fetchBilibiliHotspots()
  ]);

  const hotspots = [];
  const errors = [];

  results.forEach((result, index) => {
    const platforms = ['小红书', '微博', '抖音', 'B站'];
    if (result.status === 'fulfilled') {
      hotspots.push(...result.value);
    } else {
      console.error(`❌ ${platforms[index]} 抓取失败:`, result.reason);
      errors.push({ platform: platforms[index], error: result.reason.message });
    }
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n🎉 数据抓取完成！`);
  console.log(`📊 总计: ${hotspots.length} 个热点`);
  console.log(`⏱️  耗时: ${duration} 秒`);
  console.log(`❌ 失败: ${errors.length} 个平台`);

  if (errors.length > 0) {
    console.log('\n失败详情:');
    errors.forEach(err => console.log(`  - ${err.platform}: ${err.error}`));
  }

  return {
    success: errors.length === 0,
    hotspots,
    errors,
    duration,
    timestamp: new Date().toISOString()
  };
}

export default {
  fetchXiaohongshuHotspots,
  fetchWeiboHotspots,
  fetchDouyinHotspots,
  fetchBilibiliHotspots,
  fetchAllHotspots
};
