# 数据抓取服务使用指南

## 概述

数据抓取服务使用 **Firecrawl** 从互联网搜索和抓取热点数据，支持小红书、微博、抖音、B站四大平台。

## 技术架构

```
┌─────────────────────────────────────────────┐
│         前端 / API 调用                 │
│         POST /api/fetch                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         fetch.js 路由                      │
│         创建任务，返回 taskId               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         scraper.js 抓取服务                 │
│         并行抓取四大平台                   │
│   ┌──────┬──────┬──────┬──────┐          │
│   │小红书│ 微博 │ 抖音 │ B站  │          │
│   └───┬──┴───┬──┴───┬──┴───┘          │
└───────┼──────┼──────┼───────────────────┘
        │      │      │
        ▼      ▼      ▼
┌─────────────────────────────────────────────┐
│      Firecrawl CLI                         │
│      搜索网页 + 抓取内容                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         storage.js 存储服务                │
│         合并、去重、保存到 JSON            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      data/hotspots.json                    │
│      热点数据文件                          │
└─────────────────────────────────────────────┘
```

## 使用方法

### 方法 1：通过 API 触发（推荐）

```bash
# 1. 启动 API 服务器
cd api
npm run dev

# 2. 触发抓取任务
curl -X POST http://localhost:3000/api/fetch

# 返回示例：
# {
#   "success": true,
#   "message": "数据抓取任务已启动",
#   "taskId": "fetch_1678843200000",
#   "estimatedTime": 60
# }

# 3. 查询任务状态
curl http://localhost:3000/api/fetch/status/fetch_1678843200000

# 返回示例：
# {
#   "success": true,
#   "data": {
#     "taskId": "fetch_1678843200000",
#     "status": "running",
#     "progress": 45,
#     "platforms": {
#       "xiaohongshu": "completed",
#       "weibo": "running",
#       "douyin": "pending",
#       "bilibili": "pending"
#     }
#   }
# }
```

### 方法 2：直接运行测试脚本

```bash
cd api
npm run test-scraper
```

## 支持的平台

### 小红书 (xiaohongshu)
- 搜索关键词：美食探店、网红打卡、旅行攻略、下午茶、火锅推荐
- 数据类型：likes, collects

### 微博 (weibo)
- 搜索关键词：微博热搜榜、北京新闻、上海交通、深圳天气、成都美食
- 数据类型：readCount, discussCount

### 抖音 (douyin)
- 搜索关键词：抖音热门、网红探店、旅行视频、美食推荐、城市打卡
- 数据类型：likes, shares, comments

### B站 (bilibili)
- 搜索关键词：B站热门、二次元、动漫推荐、游戏解说、科技评测
- 数据类型：views, likes, coins

## 数据处理流程

### 1. 搜索和抓取
```javascript
firecrawl search "美食探店 小红书" \
  --limit 5 \
  --tbs qdr:d \
  --scrape \
  -o .firecrawl/search-result.json
```

### 2. 数据转换
- Firecrawl 结果 → 热点格式
- 生成唯一 ID
- 推断热点类型（food/tourism/event/acg/social_trend）
- 计算影响力评分（0-1）

### 3. 地理位置解析（模拟）
目前使用模拟数据：
- 随机选择城市：北京、上海、广州、深圳、杭州、成都
- 随机选择城区
- 在中心坐标附近随机偏移

**真实实现建议：**
- 集成地理编码 API（百度地图、高德地图）
- 从网页内容提取地址信息
- 调用 API 获取经纬度

### 4. 影响力评分计算

```javascript
// 影响力评分 = 各项指标的加权总和
score =
  min(likes / 100000, 0.5) +           // 点赞
  min(views / 1000000, 0.5) +          // 播放/阅读
  min(shares / 100000, 0.2) +          // 分享
  min(comments / 50000, 0.2) +         // 评论
  min(collects / 10000, 0.2)           // 收藏

// 限制在 0-1 之间
score = min(score, 1)
```

### 5. 数据存储
- 保存到 `data/hotspots.json`
- 合并新旧数据，去重（按 ID）
- 按影响力和时间排序
- 限制总数（默认 100）

## 数据格式

### 热点对象

```json
{
  "id": "xhs_1678843200000_1234",
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
    "url": "https://...",
    "description": "...",
    "publishTime": "2026-03-13T08:00:00Z",
    "fetchTime": "2026-03-13T09:00:00Z"
  }
}
```

## 定时抓取

### 使用 cron 定时任务

```bash
# 每 30 分钟抓取一次
*/30 * * * * cd /path/to/api && npm run test-scraper >> /var/log/hotspot-fetch.log 2>&1
```

### 使用 Node.js 定时器

```javascript
import cron from 'node-cron';

// 每 30 分钟执行
cron.schedule('*/30 * * * *', async () => {
  console.log('⏰ 定时抓取开始...');
  const result = await fetchAllHotspots();
  console.log('✅ 定时抓取完成:', result);
});
```

## 错误处理

### 常见错误

1. **Firecrawl 未登录**
   ```
   错误: Not authenticated
   解决: firecrawl login --browser
   ```

2. **API 额度不足**
   ```
   错误: Insufficient credits
   解决: 等待额度恢复或购买更多
   ```

3. **网络连接问题**
   ```
   错误: ECONNREFUSED
   解决: 检查网络连接和代理设置
   ```

4. **搜索无结果**
   ```
   警告: 找到 0 条结果
   解决: 调整搜索关键词或时间范围
   ```

### 重试机制

当前实现：使用 `Promise.allSettled`，部分平台失败不影响其他平台。

建议改进：添加指数退避重试。

## 性能优化

### 并行抓取
- 四个平台同时抓取
- 使用 `Promise.allSettled` 等待所有完成

### 缓存
- 当前未实现
- 建议：使用 Redis 缓存抓取结果

### 速率限制
- Firecrawl 有并发限制（默认 100）
- 建议控制并发数，避免超限

## 监控和日志

### 日志输出

```
🚀 开始抓取所有平台数据...

📕 开始抓取小红书热点...
🔥 执行 firecrawl 搜索: 美食探店 小红书
✅ 搜索完成，找到 5 条结果
✅ 小红书抓取完成，共 5 个热点

📟 开始抓取微博热点...
🔥 执行 firecrawl 搜索: 微博热搜榜 微博
✅ 搜索完成，找到 3 条结果
✅ 微博抓取完成，共 3 个热点

...

🎉 数据抓取完成！
📊 总计: 20 个热点
⏱️  耗时: 45.32 秒
❌ 失败: 0 个平台
```

### 任务状态查询

```bash
# 实时查询任务进度
curl http://localhost:3000/api/fetch/status/fetch_1678843200000
```

## 下一步改进

1. **真实地理位置解析**
   - 集成百度地图 API
   - 集成高德地图 API

2. **更智能的搜索**
   - 根据历史数据调整关键词
   - 使用 AI 生成搜索词

3. **内容增强**
   - 抓取图片
   - 抓取评论数据
   - 提取更详细的元数据

4. **去重算法**
   - 基于内容相似度
   - 基于地理位置
   - 基于时间窗口

5. **定时任务**
   - 自动定时抓取
   - 增量更新

## 注意事项

1. **合规性**
   - 遵守网站的 robots.txt
   - 不抓取敏感内容
   - 尊重隐私

2. **性能**
   - 控制抓取频率
   - 避免过度消耗 API 额度
   - 使用缓存减少重复请求

3. **数据质量**
   - 验证数据完整性
   - 过滤无效数据
   - 定期清理过期数据

## 参考资料

- [Firecrawl 文档](https://docs.firecrawl.dev)
- [Express.js 文档](https://expressjs.com)
- [Node.js 文档](https://nodejs.org/docs)
