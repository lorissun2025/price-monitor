# 数据抓取服务 - 快速设置指南

## 第一步：安装 Firecrawl CLI

```bash
npm install -g firecrawl-cli
```

## 第二步：登录 Firecrawl

```bash
firecrawl login --browser
```

这会自动打开浏览器，让你完成登录。

## 第三步：检查状态

```bash
firecrawl --status
```

成功输出示例：
```
  🔥 firecrawl cli v1.0.2

  ● Authenticated via FIRECRAWL_API_KEY
  Concurrency: 0/100 jobs (parallel scrape limit)
  Credits: 500,000 remaining
```

## 第四步：测试抓取

### 方法 1：通过 API

```bash
# 1. 启动 API 服务器
cd /Users/sunsensen/.openclaw/workspace/hotspot-system/api
npm run dev

# 2. 在另一个终端触发抓取
curl -X POST http://localhost:3000/api/fetch

# 3. 查看进度
curl http://localhost:3000/api/fetch/status/fetch_<taskId>
```

### 方法 2：直接测试

```bash
cd /Users/sunsensen/.openclaw/workspace/hotspot-system/api
npm run test-scraper
```

## 常见问题

### Q: firecrawl 命令不存在？

A: 检查安装：
```bash
which firecrawl
npm list -g firecrawl-cli
```

如果不存在，重新安装：
```bash
npm uninstall -g firecrawl-cli
npm install -g firecrawl-cli
```

### Q: 提示未认证？

A: 运行登录命令：
```bash
firecrawl login --browser
```

### Q: 额度不足？

A: Firecrawl 有免费额度，用完需要：
- 等待额度恢复（通常每月重置）
- 或购买更多额度

### Q: 抓取很慢？

A: 这是正常的，因为：
- Firecrawl 需要渲染 JavaScript
- 网络请求需要时间
- 四个平台并行抓取

预计耗时：30-60 秒

## 下一步

完成设置后，查看详细文档：
- [数据抓取指南](./SCRAPER-GUIDE.md)
- [API 设计文档](./API-Design.md)
- [项目 README](./README.md)
