# 热点地图 API

热点地图系统的后端 API 服务。

## 功能特性

- ✅ 热点数据查询
- ✅ 热点搜索
- ✅ 统计数据
- ✅ 数据抓取任务管理
- ✅ 平台筛选、类型筛选、城市筛选
- ✅ 分页支持

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 启动生产服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 接口

### 基础信息

- **Base URL:** `http://localhost:3000/api`
- **数据格式:** JSON

### 接口列表

#### 1. 获取热点列表

```
GET /api/hotspots
```

**查询参数:**
- `platform`: 平台筛选（xiaohongshu, weibo, douyin, bilibili）
- `type`: 类型筛选（food, tourism, event, acg, social_trend）
- `city`: 城市筛选
- `minScore`: 最小影响力评分 (0-1)
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 50，最大 100）

**示例:**
```bash
curl "http://localhost:3000/api/hotspots?platform=xiaohongshu&type=food&page=1&limit=10"
```

#### 2. 获取热点详情

```
GET /api/hotspots/:id
```

**示例:**
```bash
curl "http://localhost:3000/api/hotspots/xhs_001"
```

#### 3. 搜索热点

```
GET /api/hotspots/search?q=关键词
```

**示例:**
```bash
curl "http://localhost:3000/api/hotspots/search?q=北京"
```

#### 4. 获取统计数据

```
GET /api/stats
```

**示例:**
```bash
curl "http://localhost:3000/api/stats"
```

#### 5. 触发数据抓取

```
POST /api/fetch
```

**示例:**
```bash
curl -X POST "http://localhost:3000/api/fetch"
```

#### 6. 获取抓取任务状态

```
GET /api/fetch/status/:taskId
```

**示例:**
```bash
curl "http://localhost:3000/api/fetch/status/fetch_1234567890"
```

## 项目结构

```
api/
├── src/
│   ├── index.js          # 主入口
│   ├── routes/           # 路由
│   │   ├── hotspots.js   # 热点相关接口
│   │   ├── stats.js      # 统计接口
│   │   └── fetch.js      # 抓取任务接口
│   ├── services/         # 业务逻辑
│   └── utils/            # 工具函数
├── data/
│   └── hotspots.json     # 热点数据
├── package.json
└── .env                  # 环境变量
```

## 环境变量

在 `.env` 文件中配置：

```env
PORT=3000
NODE_ENV=development
FETCH_INTERVAL_MINUTES=30
CACHE_TTL_HOTSPOTS=300
CACHE_TTL_STATS=60
```

## 数据格式

### 热点对象

```json
{
  "id": "xhs_001",
  "platform": "xiaohongshu",
  "title": "三里屯网红咖啡厅，必打卡！",
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
```

## 开发计划

- [ ] 实现真实的数据抓取服务（集成 firecrawl）
- [ ] 添加缓存机制
- [ ] 添加认证和授权
- [ ] 添加速率限制
- [ ] 数据库集成（Supabase/MongoDB）
- [ ] WebSocket 实时推送
- [ ] 日志记录和监控

## 部署

### Vercel Functions

1. 安装 Vercel CLI:
```bash
npm install -g vercel
```

2. 部署:
```bash
vercel
```

### Docker

```bash
docker build -t hotspot-map-api .
docker run -p 3000:3000 hotspot-map-api
```

## License

MIT
