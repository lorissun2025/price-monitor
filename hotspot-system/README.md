# 热点地图系统 - 完整版

前端 + 后端 API 的完整热点地图系统。

## 🚀 快速开始

### 启动系统

```bash
./start.sh
```

### 停止系统

```bash
./stop.sh
```

### 单独启动 API

```bash
cd api
npm run dev
```

## 📁 项目结构

```
hotspot-system/
├── api/                    # 后端 API
│   ├── src/
│   │   ├── index.js        # API 主入口
│   │   ├── routes/         # API 路由
│   │   │   ├── hotspots.js # 热点接口
│   │   │   ├── stats.js    # 统计接口
│   │   │   └── fetch.js    # 抓取任务接口
│   │   ├── services/       # 业务逻辑（待实现）
│   │   └── utils/          # 工具函数（待实现）
│   ├── data/
│   │   └── hotspots.json   # 热点数据
│   ├── package.json
│   └── .env
├── hotspot-map/            # 前端
│   ├── index.html          # 主页面
│   ├── css/styles.css      # 样式
│   └── js/
│       ├── data/
│       │   ├── api.js      # API 客户端 ✨ 新增
│       │   └── hotspots.js # 模拟数据（备用）
│       ├── utils/
│       │   ├── influence.js
│       │   └── dedup.js
│       └── components/
│           ├── map.js
│           ├── popup.js
│           ├── legend.js
│           ├── filter.js
│           └── stats.js
├── API-Design.md          # API 设计文档
├── start.sh               # 启动脚本
└── stop.sh                # 停止脚本
```

## 🔌 API 接口

### 基础信息

- **Base URL:** `http://localhost:3000/api`
- **完整文档:** `api/API-Design.md`

### 主要接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/hotspots` | GET | 获取热点列表（支持筛选、分页） |
| `/hotspots/:id` | GET | 获取热点详情 |
| `/hotspots/search` | GET | 搜索热点 |
| `/stats` | GET | 获取统计数据 |
| `/fetch` | POST | 触发数据抓取 |
| `/fetch/status/:taskId` | GET | 获取抓取任务状态 |

### 示例

```bash
# 获取所有热点
curl http://localhost:3000/api/hotspots

# 按平台筛选
curl "http://localhost:3000/api/hotspots?platform=xiaohongshu"

# 搜索热点
curl "http://localhost:3000/api/hotspots/search?q=北京"

# 获取统计
curl http://localhost:3000/api/stats
```

## ✨ 新功能

### 后端 API
- ✅ 热点数据查询接口
- ✅ 热点搜索接口
- ✅ 统计数据接口
- ✅ 数据抓取任务管理（Firecrawl）
- ✅ 平台筛选、类型筛选、城市筛选
- ✅ 分页支持

### 数据抓取 ✨ 新增
- ✅ 集成 Firecrawl CLI
- ✅ 支持四大平台：小红书、微博、抖音、B站
- ✅ 智能数据转换和评分
- ✅ 地理位置模拟
- ✅ 数据合并和去重
- ✅ 任务状态查询

### 前端
- ✅ API 客户端（`js/data/api.js`）
- ✅ 自动从 API 获取数据
- ✅ 降级机制（API 失败时使用模拟数据）
- ✅ 修复全局变量冲突问题

## 🎯 已完成

### MVP (v1.0)
- ✅ 前端可视化界面
- ✅ 地图展示（Leaflet）
- ✅ 热点标记和弹窗
- ✅ 筛选系统（平台、类型）
- ✅ 统计面板
- ✅ 后端 API 服务
- ✅ API 前后端对接

### 数据管理
- ✅ JSON 数据存储
- ✅ 模拟数据（24 个热点）
- ✅ 影响力评分系统
- ✅ 去重算法（已实现，未启用）
- ✅ 数据抓取和更新 ✨ 新增

## 🚧 下一步计划

### 优先级 1：数据抓取 ✅ 已完成
- ✅ 集成 firecrawl 抓取小红书数据
- ✅ 抓取微博热搜
- ✅ 抓取抖音热门
- ✅ 抓取 B站热门视频
- ✅ 地理位置解析和标记（模拟）
- ✅ 数据合并和去重

### 优先级 2：数据优化
- [ ] 真实地理编码 API（百度地图/高德地图）
- [ ] 更智能的搜索关键词生成
- [ ] 抓取图片和评论
- [ ] 内容增强和验证
- [ ] 定时自动抓取

### 优先级 3：增强功能
- [ ] 实时数据更新（WebSocket）
- [ ] 热点收藏功能
- [ ] 热点分享功能
- [ ] 搜索功能（前端 UI）
- [ ] 缓存机制

### 优先级 3：部署
- [ ] 前端部署到 Vercel/Netlify
- [ ] 后端部署到 Vercel Functions
- [ ] 配置 CORS
- [ ] 域名配置

### 优先级 4：优化
- [ ] 性能优化
- [ ] 错误处理
- [ ] 日志记录
- [ ] 监控告警

## 🛠️ 技术栈

### 后端
- **框架:** Express.js
- **语言:** Node.js (ES Modules)
- **数据存储:** JSON 文件（计划升级到 Supabase）
- **工具:** firecrawl-cli（数据抓取）

### 前端
- **地图:** Leaflet.js
- **样式:** CSS3
- **语言:** Vanilla JavaScript

## 📊 数据统计

当前数据：
- **热点总数:** 24 个
- **平台:**
  - 小红书: 7 个
  - 微博: 7 个
  - 抖音: 6 个
  - B站: 4 个
- **类型:**
  - 美食: 5 个
  - 旅游: 8 个
  - 活动: 2 个
  - ACG: 4 个
  - 社交热点: 5 个
- **城市:**
  - 北京: 6 个
  - 上海: 5 个
  - 杭州: 4 个
  - 深圳: 4 个
  - 成都: 3 个
  - 广州: 2 个

## 🔧 开发

### 启动开发环境

```bash
# 启动 API（热重载）
cd api
npm run dev

# 启动前端（直接打开 HTML 文件）
open hotspot-map/index.html
```

### 测试 API

```bash
# 健康检查
curl http://localhost:3000/health

# 获取热点列表
curl http://localhost:3000/api/hotspots

# 获取统计数据
curl http://localhost:3000/api/stats

# 触发数据抓取
curl -X POST http://localhost:3000/api/fetch

# 查询抓取任务状态
curl http://localhost:3000/api/fetch/status/fetch_<taskId>
```

### 测试数据抓取

```bash
# 直接运行测试
cd api
npm run test-scraper
```

详细说明：
- [抓取设置指南](./SCRAPER-SETUP.md)
- [抓取使用指南](./SCRAPER-GUIDE.md)
- [快速开始](./QUICK-START.md)

## 📝 注意事项

1. **CORS 配置：** 当前 API 允许所有来源（开发模式），生产环境需要配置
2. **数据存储：** 当前使用 JSON 文件，计划升级到数据库
3. **缓存：** 当前未实现缓存，计划添加 Redis
4. **速率限制：** 当前无限制，计划添加
5. **Firecrawl 认证：** 使用数据抓取前需要先登录 `firecrawl login --browser`
6. **地理位置：** 当前使用模拟数据，真实数据需要地理编码 API

## 🎉 版本历史

- **v1.1 (2026-03-13 - 当前):**
  - ✅ 数据抓取服务（Firecrawl）
  - ✅ 支持四大平台（小红书、微博、抖音、B站）
  - ✅ 数据存储和去重
  - ✅ 抓取任务管理
  - ✅ 完整文档

- **v1.0 (2026-03-13):**
  - ✅ 后端 API 基础功能
  - ✅ 前后端对接
  - ✅ 启动/停止脚本
  - ✅ 完整文档

## 👥 作者

- **开发:** loris sun & 依依2号

## 📄 License

MIT
