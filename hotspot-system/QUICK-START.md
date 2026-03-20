# 热点地图系统 - 快速开始

## 🚀 快速启动

### 启动 API 服务器

```bash
cd /Users/sunsensen/.openclaw/workspace/hotspot-system/api
npm run dev
```

API 服务器会在 `http://localhost:3000` 启动。

### 打开前端

在浏览器中打开：
```
file:///Users/sunsensen/.openclaw/workspace/hotspot-map/index.html
```

---

## 📡 使用数据抓取

### 前置条件

Firecrawl CLI 已安装（✅ 已完成），但需要登录：

```bash
firecrawl login --browser
```

这会自动打开浏览器完成登录。

### 验证登录状态

```bash
firecrawl --status
```

成功输出：
```
🔥 firecrawl cli v1.10.0

● Authenticated via FIRECRAWL_API_KEY
Concurrency: 0/100 jobs
Credits: 500,000 remaining
```

### 开始抓取数据

**方法 1：通过 API（推荐）**

```bash
# 触发抓取任务
curl -X POST http://localhost:3000/api/fetch

# 返回任务 ID，例如：{"taskId":"fetch_1678843200000",...}

# 查询任务状态
curl http://localhost:3000/api/fetch/status/fetch_1678843200000
```

**方法 2：直接测试**

```bash
cd /Users/sunsensen/.openclaw/workspace/hotspot-system/api
npm run test-scraper
```

---

## 📊 数据流程

```
启动抓取 → Firecrawl 搜索四大平台 → 转换数据 → 保存到 JSON → 前端自动刷新
```

---

## 🛠️ API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/hotspots` | GET | 获取热点列表 |
| `/api/hotspots/:id` | GET | 获取热点详情 |
| `/api/hotspots/search` | GET | 搜索热点 |
| `/api/stats` | GET | 获取统计 |
| `/api/fetch` | POST | 触发抓取 |
| `/api/fetch/status/:id` | GET | 查询任务状态 |

---

## 📁 项目结构

```
hotspot-system/
├── api/                    # 后端 API
│   ├── src/
│   │   ├── services/
│   │   │   ├── scraper.js   # 数据抓取服务 ✨ 新增
│   │   │   └── storage.js  # 数据存储服务 ✨ 新增
│   │   └── routes/
│   │       └── fetch.js     # 抓取接口 ✨ 更新
│   ├── data/
│   │   └── hotspots.json   # 热点数据
│   └── package.json
├── hotspot-map/            # 前端
│   ├── index.html
│   └── js/
│       └── data/
│           └── api.js      # API 客户端
├── SCRAPER-SETUP.md        # 抓取设置指南 ✨ 新增
├── SCRAPER-GUIDE.md        # 抓取使用指南 ✨ 新增
└── README.md               # 完整文档
```

---

## ✨ 今天完成的新功能

### 数据抓取服务
- ✅ 集成 Firecrawl CLI
- ✅ 支持四大平台：小红书、微博、抖音、B站
- ✅ 智能数据转换和评分
- ✅ 地理位置模拟
- ✅ 数据合并和去重

### 存储
- ✅ JSON 数据持久化
- ✅ 数据去重（按 ID）
- ✅ 自动排序和限制
- ✅ 统计信息生成

### API
- ✅ 抓取任务管理
- ✅ 任务状态查询
- ✅ 实时进度更新

### 文档
- ✅ 设置指南（SCRAPER-SETUP.md）
- ✅ 使用指南（SCRAPER-GUIDE.md）
- ✅ 快速开始（本文件）

---

## 🎯 下一步操作

1. **登录 Firecrawl**
   ```bash
   firecrawl login --browser
   ```

2. **启动 API 服务器**
   ```bash
   cd api && npm run dev
   ```

3. **触发抓取**
   ```bash
   curl -X POST http://localhost:3000/api/fetch
   ```

4. **查看数据**
   打开前端页面，查看新抓取的热点！

---

## 💡 提示

- 首次抓取可能需要 30-60 秒
- 可以通过 API 查询实时进度
- 数据会自动保存到 `api/data/hotspots.json`
- 前端会自动刷新显示新数据

---

## ❓ 常见问题

**Q: 抓取很慢？**
A: 正常现象，Firecrawl 需要渲染网页，首次抓取约 30-60 秒。

**Q: 有些平台抓取失败？**
A: 网络或反爬限制，部分失败不影响其他平台。

**Q: 如何自定义抓取关键词？**
A: 编辑 `api/src/services/scraper.js` 中的 queries 数组。

---

## 📚 更多文档

- [API 设计文档](./API-Design.md)
- [抓取使用指南](./SCRAPER-GUIDE.md)
- [抓取设置指南](./SCRAPER-SETUP.md)
- [完整 README](./README.md)

---

🎉 祝使用愉快！
