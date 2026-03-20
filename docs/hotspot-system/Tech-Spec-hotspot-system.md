# 热点地图系统 - 技术方案文档

## 文档信息

- **项目名称:** 热点地图系统 (HotSpot Map System)
- **版本:** v1.2
- **创建日期:** 2026-03-12
- **更新日期:** 2026-03-19
- **技术负责人:** loris sun
- **文档类型:** 技术方案 (Technical Specification)

---

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │   Vue.js    │  │  原生 HTML  │         │
│  │   SPA       │  │   SPA       │  │   Demo      │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   REST API      │
                    │   / GraphQL     │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────┐
│                        后端层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  数据聚合器  │  │  影响力计算  │  │  数据缓存    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────┐
│      ┌──▼──┐          ┌───▼───┐         ┌────▼────┐      │
│      │SQLite│          │Redis  │         │ JSON文件 │      │
│      └─────┘          └───────┘         └─────────┘      │
└───────────────────────────── 数据层 ──────────────────────┘
          │
          │ API 请求
          │
┌─────────▼─────────────────────────────────────────────────┐
│                     外部数据源                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 小红书API │  │ 微博API  │  │ 抖音API  │  │ B站API   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 1.2 MVP 阶段架构（简化版）

为了快速迭代 MVP，采用前后端一体的轻量级架构：

```
┌─────────────────────────────────────────────────────────┐
│                   前端 (HTML + JS)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Leaflet   │  │  模拟数据   │  │  业务逻辑   │     │
│  │   地图库    │  │  (JSON)     │  │  (JS)       │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  数据存储   │
                    │  JSON 文件  │
                    └─────────────┘
```

---

## 2. 技术选型

### 2.1 前端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| **HTML/CSS/JS** | 原生 | MVP 快速开发 | 无需构建，快速验证 |
| **React** | 18.x | v1.1+ 正式版本 | 组件化，生态丰富 |
| **TypeScript** | 5.x | 类型安全 | 减少运行时错误 |
| **Vite** | 5.x | 构建工具 | 快速热更新 |
| **Tailwind CSS** | 3.x | UI 样式 | 快速开发，原子化 CSS |

### 2.2 地图技术

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| **Leaflet** | 1.9.4 | 地图渲染 | 轻量级，开源免费 |
| **OpenStreetMap** | - | 地图瓦片 | 免费开源，覆盖全球 |
| **ArcGIS** | - | 中国地图底图 | 国内访问速度快 |

### 2.3 后端技术栈 (v1.1+)

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| **Node.js** | 20.x | 运行时 | JavaScript 生态 |
| **Express** | 4.x | Web 框架 | 轻量级，灵活 |
| **SQLite** | 3.x | 数据库 | 零配置，单文件 |
| **Redis** | 7.x | 缓存 | 高性能缓存 |
| **Axios** | 1.x | HTTP 客户端 | 简单易用 |

### 2.4 部署方案

| 阶段 | 方案 | 说明 |
|------|------|------|
| **MVP** | Vercel / Netlify | 静态网站托管，免费额度 |
| **v1.1+** | Railway / Render | 支持后端 API 和数据库 |
| **v2.0** | 自建服务器 | 完整控制，企业级需求 |

---

## 3. 数据模型

### 3.1 热点数据模型 (Hotspot)

```typescript
interface Hotspot {
  // 基础信息
  id: string;                    // 唯一标识 (平台_类型_时间戳)
  platform: Platform;            // 平台类型
  title: string;                 // 标题
  content?: string;              // 内容摘要
  
  // 类型分类
  type: HotspotType;             // 热点类型
  
  // 地理位置
  location: {
    lat: number;                 // 纬度
    lng: number;                 // 经度
    city: string;                // 城市
    district: string;            // 区域
    address?: string;            // 详细地址
  };
  
  // 影响力
  influenceScore: number;        // 影响力评分 (0-1)
  influenceLevel: InfluenceLevel;// 影响力等级
  
  // 热度数据
  metrics: {
    likes?: number;              // 点赞数
    collects?: number;            // 收藏数
    views?: number;              // 播放/阅读数
    shares?: number;             // 分享数
    comments?: number;            // 评论数
    discusses?: number;           // 讨论数
    coins?: number;              // 投币数 (B站)
  };
  
  // 元数据
  metadata: {
    author?: string;             // 作者
    authorId?: string;           // 作者 ID
    category?: string;           // 分类标签
    tags?: string[];             // 标签
    publishTime: Date;           // 发布时间
    fetchTime: Date;             // 抓取时间
    url?: string;                // 原始链接
  };
  
  // 趋势数据 (v1.1)
  trends?: {
    hourlyScores: number[];      // 小时影响力变化
    dailyScores: number[];       // 每日影响力变化
  };
}
```

### 3.2 枚举类型定义

```typescript
// 平台类型
enum Platform {
  XIAOHONGSHU = 'xiaohongshu',  // 小红书
  WEIBO = 'weibo',               // 微博
  DOUYIN = 'douyin',             // 抖音
  BILIBILI = 'bilibili'          // B站
}

// 热点类型
enum HotspotType {
  FOOD = 'food',                 // 美食探店
  TOURISM = 'tourism',           // 旅游打卡
  EVENT = 'event',               // 活动
  ACG = 'acg',                   // ACG (二次元)
  SOCIAL_TREND = 'social_trend', // 社交热点
  OTHER = 'other'                // 其他
}

// 影响力等级
enum InfluenceLevel {
  VERY_HIGH = 'very_high',       // 极高影响力 (>0.8)
  HIGH = 'high',                 // 高影响力 (0.6-0.8)
  MEDIUM = 'medium',             // 中等影响力 (0.4-0.6)
  LOW = 'low',                   // 低影响力 (0.2-0.4)
  EMERGING = 'emerging'          // 新兴热点 (<0.2)
}
```

### 3.3 数据存储结构

#### MVP 阶段 (JSON 文件)

```json
{
  "version": "1.0.0",
  "lastUpdate": "2026-03-12T09:00:00Z",
  "hotspots": [
    {
      "id": "xhs_food_1709280000",
      "platform": "xiaohongshu",
      "title": "三里屯网红咖啡厅",
      "type": "food",
      "influenceScore": 0.85,
      "location": {
        "lat": 39.9370,
        "lng": 116.4477,
        "city": "北京",
        "district": "朝阳区"
      },
      "metrics": {
        "likes": 15000,
        "collects": 8000
      },
      "metadata": {
        "author": "美食小当家",
        "publishTime": "2026-03-12T08:00:00Z",
        "fetchTime": "2026-03-12T09:00:00Z"
      }
    }
  ]
}
```

#### v1.1+ 阶段 (SQLite 数据库)

```sql
-- 热点表
CREATE TABLE hotspots (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  influence_score REAL NOT NULL,
  influence_level TEXT NOT NULL,
  likes INTEGER,
  collects INTEGER,
  views INTEGER,
  shares INTEGER,
  comments INTEGER,
  discusses INTEGER,
  coins INTEGER,
  author TEXT,
  author_id TEXT,
  category TEXT,
  tags TEXT,
  publish_time TEXT NOT NULL,
  fetch_time TEXT NOT NULL,
  url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_hotspots_platform ON hotspots(platform);
CREATE INDEX idx_hotspots_type ON hotspots(type);
CREATE INDEX idx_hotspots_city ON hotspots(city);
CREATE INDEX idx_hotspots_influence_score ON hotspots(influence_score);
CREATE INDEX idx_hotspots_publish_time ON hotspots(publish_time);
```

---

## 4. 核心算法设计

### 4.1 影响力评分算法

#### 算法目标

综合评估热点的传播度、讨论度、时效性和持续性，输出 0-1 的量化评分。

#### 评分公式

```typescript
function calculateInfluenceScore(hotspot: Hotspot): number {
  // 1. 传播度得分 (0-1)
  const spreadScore = calculateSpreadScore(hotspot.metrics);
  
  // 2. 讨论度得分 (0-1)
  const discussScore = calculateDiscussScore(hotspot.metrics);
  
  // 3. 时效性得分 (0-1)
  const timeScore = calculateTimeScore(hotspot.metadata.publishTime);
  
  // 4. 综合评分
  const weights = {
    spread: 0.5,      // 传播度权重 50%
    discuss: 0.3,     // 讨论度权重 30%
    time: 0.2         // 时效性权重 20%
  };
  
  const finalScore = 
    spreadScore * weights.spread +
    discussScore * weights.discuss +
    timeScore * weights.time;
  
  return Math.min(Math.max(finalScore, 0), 1); // 限制在 0-1
}

// 传播度得分
function calculateSpreadScore(metrics: Metrics): number {
  const normalizedViews = normalizeNumber(metrics.views || 0, 1000000); // 100w 为满分
  const normalizedLikes = normalizeNumber(metrics.likes || 0, 100000);  // 10w 为满分
  const normalizedCollects = normalizeNumber(metrics.collects || 0, 50000); // 5w 为满分
  
  return (normalizedViews * 0.4 + normalizedLikes * 0.4 + normalizedCollects * 0.2);
}

// 讨论度得分
function calculateDiscussScore(metrics: Metrics): number {
  const normalizedComments = normalizeNumber(metrics.comments || 0, 10000);  // 1w 为满分
  const normalizedShares = normalizeNumber(metrics.shares || 0, 5000);        // 5000 为满分
  const normalizedDiscusses = normalizeNumber(metrics.discusses || 0, 50000); // 5w 为满分
  
  return (normalizedComments * 0.5 + normalizedShares * 0.3 + normalizedDiscusses * 0.2);
}

// 时效性得分 (指数衰减)
function calculateTimeScore(publishTime: Date): number {
  const now = new Date();
  const hoursPassed = (now.getTime() - publishTime.getTime()) / (1000 * 60 * 60);
  const halfLife = 24; // 半衰期 24 小时
  
  return Math.pow(0.5, hoursPassed / halfLife);
}

// 数字归一化
function normalizeNumber(value: number, max: number): number {
  return Math.min(value / max, 1);
}
```

#### 影响力等级划分

| 评分范围 | 等级 | 颜色 | 标签 |
|----------|------|------|------|
| > 0.8 | 极高影响力 | #FF0000 (红) | 🔥 极高 |
| 0.6 - 0.8 | 高影响力 | #FF6600 (橙) | ⭐ 高 |
| 0.4 - 0.6 | 中等影响力 | #FFCC00 (黄) | ⭐⭐ 中 |
| 0.2 - 0.4 | 低影响力 | #00CCFF (蓝) | ⭐⭐ 低 |
| < 0.2 | 新兴热点 | #00CC00 (绿) | ⭐⭐ 新 |

### 4.2 热点去重算法

#### 问题

不同平台可能报道同一个热点（如同一餐厅、同一活动），需要去重合并。

#### 算法思路

1. **基于位置去重** - 计算热点之间的距离，距离 < 500m 的视为同一热点
2. **基于标题相似度** - 计算标题文本相似度，相似度 > 0.8 的视为同一热点
3. **基于发布时间** - 时间差 < 24 小时的才考虑合并

#### 实现代码

```typescript
function deduplicateHotspots(hotspots: Hotspot[]): Hotspot[] {
  const groups: Hotspot[][] = [];
  
  // 初始化，每个热点一组
  hotspots.forEach(hotspot => {
    groups.push([hotspot]);
  });
  
  // 两两比较，合并相似的组
  let merged = true;
  while (merged) {
    merged = false;
    
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (shouldMerge(groups[i], groups[j])) {
          // 合并组
          groups[i] = [...groups[i], ...groups[j]];
          groups.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }
  
  // 每组选取影响力最高的作为代表
  return groups.map(group => {
    const sorted = group.sort((a, b) => b.influenceScore - a.influenceScore);
    const main = sorted[0];
    
    // 添加其他平台数据
    main.metadata.relatedPlatforms = sorted
      .filter(h => h.platform !== main.platform)
      .map(h => h.platform);
    
    return main;
  });
}

function shouldMerge(group1: Hotspot[], group2: Hotspot[]): boolean {
  // 任意一对热点相似，则合并
  for (const h1 of group1) {
    for (const h2 of group2) {
      if (isSimilar(h1, h2)) {
        return true;
      }
    }
  }
  return false;
}

function isSimilar(h1: Hotspot, h2: Hotspot): boolean {
  // 1. 时间差 < 24 小时
  const timeDiff = Math.abs(
    h1.metadata.publishTime.getTime() - h2.metadata.publishTime.getTime()
  );
  if (timeDiff > 24 * 60 * 60 * 1000) return false;
  
  // 2. 距离 < 500m
  const distance = calculateDistance(
    h1.location.lat, h1.location.lng,
    h2.location.lat, h2.location.lng
  );
  if (distance > 0.5) return false; // 500m
  
  // 3. 标题相似度 > 0.8
  const similarity = calculateStringSimilarity(h1.title, h2.title);
  if (similarity < 0.8) return false;
  
  return true;
}

// 计算两个坐标之间的距离 (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 计算字符串相似度 (Jaccard 相似度)
function calculateStringSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(''));
  const set2 = new Set(str2.toLowerCase().split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}
```

---

## 5. API 设计

### 5.1 MVP 阶段 (无 API)

数据直接嵌入前端 JSON 文件，无需 API。

### 5.2 v1.1+ RESTful API

#### 热点相关接口

```typescript
// 获取热点列表
GET /api/hotspots
Query Parameters:
  - platform?: string[]      // 平台筛选
  - type?: string[]          // 类型筛选
  - city?: string            // 城市筛选
  - minInfluence?: number    // 最小影响力
  - maxInfluence?: number    // 最大影响力
  - startTime?: Date         // 开始时间
  - endTime?: Date           // 结束时间
  - page?: number            // 页码
  - pageSize?: number        // 每页数量

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hotspots": Hotspot[]
  }
}

// 获取热点详情
GET /api/hotspots/:id

Response:
{
  "code": 200,
  "message": "success",
  "data": Hotspot
}

// 获取热点统计
GET /api/hotspots/stats

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 500,
    "byPlatform": {
      "xiaohongshu": 150,
      "weibo": 120,
      "douyin": 130,
      "bilibili": 100
    },
    "byType": {
      "food": 100,
      "tourism": 80,
      "event": 60,
      "acg": 50,
      "social_trend": 110,
      "other": 100
    },
    "byCity": {
      "北京": 80,
      "上海": 70,
      "广州": 50,
      "深圳": 45
    },
    "influenceDistribution": {
      "very_high": 50,
      "high": 100,
      "medium": 150,
      "low": 120,
      "emerging": 80
    }
  }
}

// 获取趋势数据 (v1.1)
GET /api/hotspots/:id/trends

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "hourlyScores": number[],
    "dailyScores": number[]
  }
}
```

#### 平台相关接口

```typescript
// 获取支持的平台列表
GET /api/platforms

Response:
{
  "code": 200,
  "message": "success",
  "data": Platform[]
}

// 获取平台热点统计
GET /api/platforms/:platform/stats

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 150,
    "avgInfluence": 0.65,
    "hotTopics": string[]
  }
}
```

---

## 6. 前端实现

### 6.1 项目结构 (MVP)

```
hotspot-map/
├── index.html              # 主页面
├── css/
│   └── styles.css          # 样式文件
├── js/
│   ├── data/
│   │   └── hotspots.json   # 热点数据
│   ├── map.js              # 地图相关逻辑
│   ├── filter.js           # 筛选逻辑
│   ├── api.js              # API 请求 (v1.1)
│   └── app.js              # 主应用逻辑
└── assets/                 # 静态资源
    └── images/
```

### 6.2 项目结构 (v1.2)

```
hotspot-map/
├── index.html              # 主页面
├── css/
│   └── styles.css          # 样式文件
├── js/
│   ├── data/
│   │   ├── api.js          # API 客户端（v1.1）
│   │   └── hotspots.js     # 热点数据（模拟）
│   ├── utils/
│   │   ├── influence.js    # 影响力计算工具
│   │   ├── dedup.js       # 去重工具
│   │   └── geo.js         # 地理位置工具（v1.2 新增）
│   ├── components/
│   │   ├── map.js          # 地图组件
│   │   ├── popup.js        # 弹窗组件（v1.2 增强）
│   │   ├── legend.js       # 图例组件
│   │   ├── filter.js       # 筛选组件
│   │   ├── stats.js        # 统计组件（v1.2 增强）
│   │   ├── location.js     # 定位组件（v1.2 新增）
│   │   └── distance-filter.js  # 距离筛选组件（v1.2 新增）
│   └── app.js              # 主应用入口
├── server/                 # 后端 API 服务器（v1.1）
│   ├── package.json
│   └── index.js
├── assets/                 # 静态资源
├── CHANGELOG-v1.1.md       # v1.1 更新日志
├── CHANGELOG-v1.2.md       # v1.2 更新日志
├── CHECKPOINT.json         # 开发检查点（v1.2）
├── AI-NATIVE-ANALYSIS.md   # AI 原生分析文档（v1.2）
└── README.md               # 项目说明
```

### 6.3 项目结构 (v1.1+ React)

```
hotspot-map/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── index.tsx
│   │   │   ├── HotspotMarker.tsx
│   │   │   └── HotspotPopup.tsx
│   │   ├── Filter/
│   │   │   ├── QuickFilter.tsx
│   │   │   └── PlatformFilter.tsx
│   │   ├── Stats/
│   │   │   └── StatsPanel.tsx
│   │   └── Layout/
│   │       └── Sidebar.tsx
│   ├── hooks/
│   │   ├── useHotspots.ts
│   │   ├── useMap.ts
│   │   └── useFilter.ts
│   ├── utils/
│   │   ├── api.ts
│   │   ├── influence.ts
│   │   └── format.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 7. 后端实现 (v1.1+)

### 7.1 项目结构

```
hotspot-api/
├── src/
│   ├── routes/
│   │   ├── hotspots.ts
│   │   ├── platforms.ts
│   │   └── stats.ts
│   ├── services/
│   │   ├── hotspot.service.ts
│   │   ├── influence.service.ts
│   │   ├── aggregator.service.ts
│   │   └── dedup.service.ts
│   ├── models/
│   │   └── hotspot.model.ts
│   ├── utils/
│   │   ├── api-client.ts
│   │   └── cache.ts
│   ├── database/
│   │   └── db.ts
│   └── app.ts
├── data/
│   └── hotspots.db
├── package.json
└── tsconfig.json
```

### 7.2 数据聚合服务

```typescript
// src/services/aggregator.service.ts
class AggregatorService {
  private platforms = {
    xiaohongshu: new XiaohongshuClient(),
    weibo: new WeiboClient(),
    douyin: new DouyinClient(),
    bilibili: new BilibiliClient()
  };
  
  async aggregateAllHotspots(): Promise<Hotspot[]> {
    const results = await Promise.all(
      Object.entries(this.platforms).map(async ([platform, client]) => {
        try {
          return await client.fetchHotspots();
        } catch (error) {
          console.error(`Failed to fetch ${platform}:`, error);
          return [];
        }
      })
    );
    
    // 扁平化结果
    const hotspots = results.flat();
    
    // 计算影响力评分
    hotspots.forEach(h => {
      h.influenceScore = calculateInfluenceScore(h);
      h.influenceLevel = this.getInfluenceLevel(h.influenceScore);
    });
    
    // 去重
    const deduped = deduplicateHotspots(hotspots);
    
    return deduped;
  }
}
```

---

## 8. 部署方案

### 8.1 MVP 阶段部署

#### 方案 1: Vercel

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
cd hotspot-map
vercel
```

#### 方案 2: Netlify

```bash
# 1. 安装 Netlify CLI
npm i -g netlify-cli

# 2. 登录
netlify login

# 3. 部署
netlify deploy --prod
```

### 8.2 v1.1+ 阶段部署

#### 方案 1: Railway

```yaml
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/app.js"
  }
}
```

#### 方案 2: Render

```yaml
# render.yaml
services:
  - type: web
    name: hotspot-api
    env: node
    buildCommand: npm run build
    startCommand: npm run start
    envVars:
      - key: DATABASE_URL
        value: file:./data/hotspots.db
```

---

## 9. 版本迭代规划

### 9.1 MVP 版本 (v1.0) - 2026-03-12 ~ 2026-03-15

#### 9.1.1 技术目标

- ✅ 快速验证产品可行性
- ✅ 使用轻量级架构，降低开发成本
- ✅ 验证地图可视化效果
- ✅ 测试用户体验

#### 9.1.2 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                   前端 (HTML + JS)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Leaflet   │  │  模拟数据   │  │  业务逻辑   │     │
│  │   地图库    │  │  (JSON)     │  │  (JS)       │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  数据存储   │
                    │  JSON 文件  │
                    └─────────────┘
```

#### 9.1.3 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | HTML + CSS + JS | 原生 | 无需构建，快速开发 |
| **地图库** | Leaflet | 1.9.4 | 开源地图库 |
| **地图瓦片** | OpenStreetMap | - | 免费瓦片服务 |
| **数据存储** | JSON | - | 静态文件存储 |
| **部署** | Vercel / Netlify | - | 静态网站托管 |

#### 9.1.4 技术特性

- **无后端 API** - 所有逻辑在前端完成
- **模拟数据** - 使用 JSON 文件存储热点数据
- **静态部署** - 部署到 Vercel，无需服务器
- **快速迭代** - 开发、测试、部署全流程 < 4 小时

#### 9.1.5 技术约束

- ❌ 不支持实时数据更新
- ❌ 不支持用户登录和个性化
- ❌ 数据量受限（< 1000 条热点）
- ❌ 无数据持久化
- ❌ 无 API 接口

#### 9.1.6 技术里程碑

| 日期 | 里程碑 | 说明 |
|------|--------|------|
| 2026-03-12 | PRD 和技术方案完成 | 文档编写完成 |
| 2026-03-13 | Demo 改进完成 | 代码重构，功能完善 |
| 2026-03-14 | 测试和优化 | 功能测试，性能优化 |
| 2026-03-15 | MVP 发布 | 部署到 Vercel，上线 |

---

### 9.2 增强版本 (v1.1) - 2026-03-16 ~ 2026-03-20

#### 9.2.1 技术目标

- ✅ 引入后端 API，支持真实数据
- ✅ 使用 React 重构前端，提升开发效率
- ✅ 支持数据库存储，解决数据量问题
- ✅ 实现用户个性化功能

#### 9.2.2 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端层 (React)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  React SPA  │  │  组件库     │  │  状态管理   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   REST API      │
                    │   (Express)     │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────┐
│                        后端层 (Node.js)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  数据聚合器  │  │  影响力计算  │  │  数据缓存    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────┐
│      ┌──▼──┐          ┌───▼───┐         ┌────▼────┐      │
│      │SQLite│          │Redis  │         │ JSON文件 │      │
│      └─────┘          └───────┘         └─────────┘      │
└───────────────────────────── 数据层 ──────────────────────┘
          │
          │ API 请求
          │
┌─────────▼─────────────────────────────────────────────────┐
│                     外部数据源                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 小红书API │  │ 微博API  │  │ 抖音API  │  │ B站API   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘
```

#### 9.2.3 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | React | 18.x | 组件化开发 |
| **构建工具** | Vite | 5.x | 快速构建和热更新 |
| **类型系统** | TypeScript | 5.x | 类型安全 |
| **UI 框架** | Tailwind CSS | 3.x | 快速样式开发 |
| **状态管理** | Zustand / Jotai | - | 轻量级状态管理 |
| **运行时** | Node.js | 20.x | JavaScript 运行时 |
| **Web 框架** | Express | 4.x | 后端框架 |
| **数据库** | SQLite | 3.x | 轻量级关系型数据库 |
| **缓存** | Redis | 7.x | 高性能缓存 |
| **HTTP 客户端** | Axios | 1.x | API 请求 |
| **部署** | Railway / Render | - | 支持后端的部署平台 |

#### 9.2.4 技术特性

- ✅ **RESTful API** - 标准化的 API 接口
- ✅ **真实数据** - 接入各平台 API，获取真实热点数据
- ✅ **数据库存储** - SQLite 持久化存储，支持大数据量
- ✅ **Redis 缓存** - 提升查询性能
- ✅ **TypeScript** - 类型安全，减少运行时错误
- ✅ **组件化** - React 组件化，提升代码复用性
- ✅ **热更新** - Vite 支持，开发体验提升

#### 9.2.5 新增技术能力

| 功能 | 技术实现 | 说明 |
|------|----------|------|
| 数据聚合 | Node.js + Axios | 定时抓取各平台数据 |
| 影响力计算 | 算法服务 | 多维度评分算法 |
| 数据去重 | 相似度算法 | 位置 + 标题 + 时间 |
| 趋势分析 | 时序数据库 | 存储历史数据 |
| 用户个性化 | 本地存储 + 算法推荐 | 基于行为的推荐 |
| 数据导出 | 文件生成 API | CSV/JSON/PDF 导出 |

#### 9.2.6 技术约束

- ❌ 不支持实时数据流（WebSocket）
- ❌ 不支持分布式部署
- ❌ 数据库单机模式
- ❌ 缓存容量受限于单机内存
- ❌ 无 AI 能力

#### 9.2.7 技术里程碑

| 日期 | 里程碑 | 说明 |
|------|--------|------|
| 2026-03-16 | 后端 API 搭建完成 | Express + SQLite |
| 2026-03-17 | 数据聚合服务完成 | 接入各平台 API |
| 2026-03-18 | React 前端重构完成 | 组件化架构 |
| 2026-03-19 | 新功能开发和测试 | 趋势分析、个性化推荐 |
| 2026-03-20 | v1.1 发布 | 部署到 Railway |

---

### 9.3 企业版本 (v2.0) - 待定

#### 9.3.1 技术目标

- ✅ 引入 AI 能力，提升智能化水平
- ✅ 实现实时数据流，降低数据延迟
- ✅ 支持分布式部署，提升系统可用性
- ✅ 提供企业级功能，支持商业化

#### 9.3.2 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端层 (Next.js SSR)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Next.js    │  │  AI Agent   │  │  实时更新   │             │
│  │  (SSR/SSG)  │  │  集成       │  │  (WebSocket)│             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   GraphQL API   │
                    │   (Apollo)      │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────┐
│                      后端层 (微服务)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  数据服务   │  │  AI 服务    │  │  用户服务   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  推荐服务   │  │  消息服务   │  │  分析服务   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────┐
│      ┌──▼──┐          ┌───▼───┐         ┌────▼────┐      │
│      │PG   │          │Redis  │         │ Elastic │      │
│      │集群 │          │集群   │         │ Search  │      │
│      └─────┘          └───────┘         └─────────┘      │
└───────────────────────────── 数据层 ──────────────────────┘
          │
          │ API 请求 / WebSocket
          │
┌─────────▼─────────────────────────────────────────────────┐
│                     外部数据源                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 小红书API │  │ 微博API  │  │ 抖音API  │  │ B站API   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  AI API  │  │  第三方   │  │  其他API  │               │
│  │ (LLM等)  │  │  数据源   │  │          │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└───────────────────────────────────────────────────────────┘
```

#### 9.3.3 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | Next.js | 14.x | React 框架，支持 SSR |
| **构建工具** | Turbopack | - | 高性能构建工具 |
| **类型系统** | TypeScript | 5.x | 类型安全 |
| **UI 框架** | Tailwind CSS | 3.x | 快速样式开发 |
| **状态管理** | TanStack Query | - | 服务端状态管理 |
| **运行时** | Node.js | 20.x | JavaScript 运行时 |
| **API 类型** | GraphQL | - | 类型安全的 API |
| **API 框架** | Apollo Server | 4.x | GraphQL 服务端 |
| **数据库** | PostgreSQL | 16.x | 企业级关系型数据库 |
| **数据库** | PostgreSQL | 集群 | 主从复制，读写分离 |
| **搜索引擎** | Elasticsearch | 8.x | 全文搜索 |
| **缓存** | Redis | 集群 | 分布式缓存 |
| **消息队列** | RabbitMQ / Kafka | - | 异步消息处理 |
| **AI 框架** | LangChain | - | LLM 应用开发 |
| **AI 模型** | GPT-4 / Claude | - | 大语言模型 |
| **部署** | Kubernetes (K8s) | - | 容器编排 |
| **监控** | Prometheus + Grafana | - | 系统监控 |
| **日志** | ELK Stack | - | 日志聚合分析 |

#### 9.3.4 技术特性

- ✅ **SSR/SSG** - Next.js 服务端渲染，SEO 友好
- ✅ **GraphQL** - 类型安全的 API，按需查询
- ✅ **实时数据流** - WebSocket 推送，毫秒级延迟
- ✅ **分布式数据库** - PostgreSQL 集群，高可用
- ✅ **全文搜索** - Elasticsearch，高性能搜索
- ✅ **AI 驱动** - 智能推荐、自动摘要、情感分析
- ✅ **微服务架构** - 服务解耦，独立部署
- ✅ **容器化** - Docker + K8s，弹性伸缩
- ✅ **企业级监控** - 完整的监控和告警体系

#### 9.3.5 新增技术能力

| 功能 | 技术实现 | 说明 |
|------|----------|------|
| AI 智能推荐 | LLM + 向量搜索 | 基于用户行为的个性化推荐 |
| 自动摘要 | LLM API | 热点内容智能摘要 |
| 情感分析 | NLP 模型 | 分析热点情感倾向 |
| 热点预测 | 时序预测模型 | 预测热点趋势 |
| 实时推送 | WebSocket + 消息队列 | 热点实时推送 |
| 全文搜索 | Elasticsearch | 高性能全文搜索 |
| 数据分析 | BI 工具 | 数据可视化分析 |
| API 开放 | GraphQL API | 第三方接入 |

#### 9.3.6 企业级功能

| 功能 | 技术实现 | 说明 |
|------|----------|------|
| 用户认证 | JWT + OAuth2 | 用户登录和权限管理 |
| 团队协作 | 多租户架构 | 企业级团队协作 |
| 数据报告 | PDF 生成 | 自动生成热点分析报告 |
| 定制化看板 | 可配置看板 | 企业定制化需求 |
| API 密钥管理 | 密钥生成和管理 | API 访问控制 |
| 使用量统计 | 计费系统 | 按使用量计费 |
| SLA 保证 | 高可用架构 | 99.9% 可用性 |

#### 9.3.7 技术里程碑

| 日期 | 里程碑 | 说明 |
|------|--------|------|
| 待定 | 技术选型完成 | 确定技术栈和架构 |
| 待定 | AI 服务开发完成 | 集成 LLM API |
| 待定 | 实时数据流完成 | WebSocket 推送 |
| 待定 | 微服务架构重构 | 服务拆分 |
| 待定 | 分布式部署完成 | K8s 集群 |
| 待定 | 企业功能开发完成 | 用户认证、团队协作 |
| 待定 | v2.0 发布 | 正式上线 |

---

### 9.4 版本对比

| 特性 | v1.0 MVP | v1.1 增强版 | v2.0 企业版 |
|------|----------|-------------|-------------|
| **前端** | HTML + JS | React + TS | Next.js + SSR |
| **后端** | 无 | Express + Node.js | 微服务架构 |
| **数据库** | JSON | SQLite | PostgreSQL 集群 |
| **缓存** | 无 | Redis | Redis 集群 |
| **API** | 无 | RESTful | GraphQL |
| **实时性** | 无 | 定时更新 | WebSocket 实时 |
| **AI 能力** | 无 | 无 | LLM + 推荐 |
| **搜索** | 前端过滤 | 数据库查询 | Elasticsearch |
| **用户系统** | 无 | 本地存储 | JWT + OAuth2 |
| **部署** | Vercel 静态 | Railway | Kubernetes |
| **监控** | 无 | 基础日志 | Prometheus + Grafana |
| **数据量** | < 1000 | < 10万 | 无限制 |
| **可用性** | 95% | 99% | 99.9% |

---

### 9.5 技术演进路线

```
v1.0 MVP (2026-03-15)
    ↓ 轻量级验证
v1.1 增强版 (2026-03-20)
    ↓ 功能完善
v2.0 企业版 (待定)
    ↓ 规模化运营
v3.0 智能化 (未来)
    - 多模态 AI（图像、视频分析）
    - 联邦学习（跨平台数据协作）
    - 边缘计算（更低延迟）
```

---

## 10. 监控和日志

### 9.1 前端监控

- **性能监控:** Web Vitals (LCP, FID, CLS)
- **错误监控:** try-catch 捕获，上报到 Sentry
- **用户行为:** 点击事件、筛选使用情况

### 9.2 后端监控 (v1.1+)

- **API 性能:** 响应时间、吞吐量
- **错误率:** 500 错误率监控
- **数据库查询:** 慢查询监控
- **缓存命中率:** Redis 缓存效率

---

## 11. 安全考虑

### 10.1 数据安全

- HTTPS 加密传输
- API 频率限制 (Rate Limiting)
- SQL 注入防护 (参数化查询)
- XSS 防护 (输入转义)

### 10.2 隐私保护

- 不存储用户个人信息
- 敏感数据脱敏
- 遵守各平台 API 使用条款

---

## 12. 测试策略

### 11.1 单元测试

- 影响力评分算法测试
- 去重算法测试
- API 接口测试

### 11.2 集成测试

- 数据聚合流程测试
- 前后端接口联调测试

### 11.3 E2E 测试

- 使用 Playwright 进行端到端测试
- 覆盖核心用户流程

---

## 13. 性能优化

### 12.1 前端优化

- **代码分割:** 路由级别懒加载
- **虚拟列表:** 大量热点时只渲染可视区域
- **图片优化:** WebP 格式，懒加载
- **缓存策略:** Service Worker 缓存静态资源

### 12.2 后端优化

- **数据库索引:** 常用查询字段建立索引
- **缓存层:** Redis 缓存热点数据
- **CDN 加速:** 静态资源 CDN 分发
- **并发控制:** 限制 API 调用频率

---

## 14. 开发计划

### 13.1 MVP 开发任务 (v1.0)

| 任务 | 优先级 | 预计时间 | 状态 |
|------|--------|----------|------|
| PRD 和技术方案文档 | P0 | 4h | ✅ |
| 前端框架搭建 (HTML+JS) | P0 | 2h | |
| 地图集成 (Leaflet) | P0 | 2h | |
| 模拟数据生成 | P0 | 1h | |
| 热点渲染逻辑 | P0 | 3h | |
| 筛选功能实现 | P0 | 3h | |
| 影响力评分算法 | P0 | 2h | |
| 详情弹窗 | P0 | 2h | |
| 统计面板 | P1 | 2h | |
| 样式优化 | P1 | 3h | |
| 部署上线 | P0 | 1h | |
| 测试和 Bug 修复 | P0 | 4h | |

### 13.2 v1.1 开发任务

| 任务 | 优先级 | 预计时间 | 状态 |
|------|--------|----------|------|
| 后端 API 搭建 | P0 | 8h | |
| 数据库设计 | P0 | 4h | |
| 数据聚合服务 | P0 | 12h | |
| 趋势分析功能 | P1 | 8h | |
| React 重构前端 | P0 | 12h | |
| 用户个性化推荐 | P2 | 8h | |
| 社交功能 | P2 | 8h | |
| 导出功能 | P1 | 4h | |

---

## 15. 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.2 | 2026-03-19 | 添加用户位置定位、距离计算筛选、距离排序、距离统计、导航链接功能；更新项目结构和相关模块 | 小音 |
| v1.1 | 2026-03-12 | 补充完整版本迭代规划（v1.0、v1.1、v2.0）| 小音 |
| v1.0 | 2026-03-12 | 初始版本创建 | 小音 |

---

**文档结束**
