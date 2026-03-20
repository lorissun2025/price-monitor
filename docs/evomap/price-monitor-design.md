# 竞品价格监控系统 - 设计文档

**版本:** v1.0
**类型:** innovate（创新）
**创建时间:** 2026-03-18
**目标市场:** 电商运营、价格敏感型用户

---

## 📋 需求分析

### 痛点
1. **手动比价麻烦** - 多个平台切换查询，耗时费力
2. **价格变动未知** - 价格下降时不能及时发现
3. **历史价格缺失** - 没有价格趋势分析，无法判断最佳购买时机
4. **错过优惠** - 促销活动容易错过

### 目标用户
- **电商运营** - 监控竞品价格，制定价格策略
- **价格敏感型用户** - 等待降价再购买
- **代购/团购** - 批量购买前比价

### 核心价值
- **节省时间** - 自动监控，无需手动查询
- **及时发现降价** - 价格变动实时提醒
- **价格趋势分析** - 了解历史价格波动
- **防反爬策略** - 使用代理池、随机延迟等技术

---

## 🎯 功能设计

### 核心功能

#### 1. 多平台价格监控
```
支持平台：
- 淘宝（Taobao）
- 京东（JD）
- 拼多多（PDD）
- 亚马逊（Amazon）

监控方式：
- API 接口（如果有）
- 网页抓取（主要方式）
- 定时查询（可配置间隔）
```

#### 2. 价格变动提醒
```
提醒方式：
- 控制台日志
- 文件记录
- 可扩展：邮件、微信、飞书

提醒条件：
- 价格下降超过 X%
- 价格低于目标价
- 价格恢复历史最低

提醒内容：
- 商品名称
- 原价 vs 现价
- 降幅
- 链接
```

#### 3. 价格趋势分析
```
分析内容：
- 最高价
- 最低价
- 平均价
- 价格波动范围
- 降价频率

可视化：
- 价格曲线图（可选，v2.0）
- 数据表格

分析周期：
- 7 天
- 30 天
- 90 天
```

#### 4. 批量监控
```
功能：
- 支持监控多个商品
- 可配置每个商品的监控频率
- 可配置每个商品的提醒规则
- 支持导入/导出监控列表

配置示例：
{
  "products": [
    {
      "name": "iPhone 15 Pro",
      "platform": "jd",
      "url": "https://item.jd.com/123456.html",
      "target_price": 6999,
      "check_interval": 3600,
      "notify_rules": {
        "drop_threshold": 0.05,  // 降价 5% 提醒
        "below_target": true,    // 低于目标价提醒
      }
    }
  ]
}
```

### 高级功能（v2.0）
- 历史价格数据库
- 价格预测（基于历史数据）
- 价格图表可视化
- 多用户管理
- 移动端 APP

---

## 🔧 技术方案

### 技术栈
- **语言**: JavaScript (Node.js)
- **抓取**: Puppeteer / Playwright / Cheerio
- **存储**: JSON 文件 / SQLite（可选）
- **定时任务**: node-cron
- **日志**: winston

### 架构设计

```
┌─────────────────────────────────────┐
│     竞品价格监控系统               │
└─────────────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼───┐     ┌──▼────┐
│ 配置   │     │ 监控器  │
│ 模块   │────▶│ Monitor │
└───────┘     └──┬─────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
   ┌────▼───┐ ┌──▼───┐ ┌──▼───┐
   │ 淘宝   │ │ 京东  │ │拼多多  │
   │ 抓取器 │ │ 抓取器│ │ 抓取器│
   └────┬───┘ └──┬───┘ └──┬───┘
        │          │         │
        └──────────┼─────────┘
                   │
              ┌──▼────┐
              │ 分析器 │
              └──┬────┘
                 │
         ┌───────┼───────┐
         │       │       │
      ┌──▼───┐ ┌─▼────┐ ┌▼─────┐
      │ 提醒  │ │ 存储  │ │ 报告  │
      │ 模块  │ │ 模块  │ │ 生成器 │
      └───────┘ └───────┘ └───────┘
```

### 模块设计

#### 1. 配置模块 (Config)
```javascript
{
  // 监控配置
  products: [
    {
      id: "p001",
      name: "商品名称",
      platform: "taobao", // taobao, jd, pdd, amazon
      url: "商品 URL",
      targetPrice: 100, // 目标价格
      checkInterval: 3600, // 检查间隔（秒）
      enabled: true, // 是否启用
    }
  ],

  // 全局配置
  global: {
    maxConcurrent: 3, // 最大并发数
    userAgent: "Mozilla/5.0...", // User-Agent
    retryTimes: 3, // 失败重试次数
    retryDelay: 5000, // 重试延迟（毫秒）
  },

  // 提醒配置
  notification: {
    onDrop: true, // 降价提醒
    onBelowTarget: true, // 低于目标价提醒
    dropThreshold: 0.05, // 降价阈值（5%）
  },

  // 输出配置
  output: {
    logFile: "price-monitor.log",
    dataFile: "price-data.json",
    reportFile: "price-report.md",
  }
}
```

#### 2. 监控器 (Monitor)
```javascript
class Monitor {
  // 添加监控商品
  addProduct(product) {}

  // 移除监控商品
  removeProduct(productId) {}

  // 启动监控
  start() {}

  // 停止监控
  stop() {}

  // 执行一次检查
  checkOnce() {}

  // 批量检查
  checkAll() {}
}
```

#### 3. 价格抓取器 (Fetcher)
```javascript
class Fetcher {
  // 淘宝
  async fetchTaobao(url) {}

  // 京东
  async fetchJD(url) {}

  // 拼多多
  async fetchPDD(url) {}

  // 亚马逊
  async fetchAmazon(url) {}

  // 通用抓取
  async fetchPrice(platform, url) {}
}
```

#### 4. 分析器 (Analyzer)
```javascript
class Analyzer {
  // 分析价格趋势
  analyzeTrend(priceHistory) {}

  // 判断是否降价
  isDrop(currentPrice, history) {}

  // 计算价格统计
  calculateStats(priceHistory) {}

  // 生成分析报告
  generateReport(products) {}
}
```

#### 5. 提醒模块 (Notifier)
```javascript
class Notifier {
  // 发送降价提醒
  sendDropAlert(product, dropInfo) {}

  // 发送低于目标价提醒
  sendBelowTargetAlert(product) {}

  // 记录到日志
  log(product, message) {}
}
```

---

## 📝 使用流程

### 1. 初始化配置
```javascript
const config = {
  products: [
    {
      name: "iPhone 15 Pro",
      platform: "jd",
      url: "https://item.jd.com/123456.html",
      targetPrice: 6999,
    }
  ],
  // ...
};

// 保存到 config.json
fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
```

### 2. 启动监控
```bash
# 单次检查
npm run check

# 启动定时监控
npm start
# 或
node index.js start
```

### 3. 查看报告
```bash
npm run report
```

---

## 📊 报告示例

```markdown
# 📊 价格监控报告

生成时间：2026-03-18 17:00
监控商品：3 个
监控周期：7 天

## 📈 商品详情

### 1. iPhone 15 Pro
- **当前价格：** ¥7,299
- **最低价格：** ¥6,799
- **最高价格：** ¥7,999
- **平均价格：** ¥7,299
- **价格波动：** ¥1,200
- **降价次数：** 3 次

**价格趋势：**
```
7,999 ┼
       │  ╰─╮
7,799 ┼      │
       │      ╰─╮
7,599 ┼          │
       │          ╰─╮
7,399 ┼              │
       │              ╰─╮
7,199 ┼                  │
       │                  ╰─╮
6,999 ┼                      │
       └───────────────────────
```

**最近变动：**
- 2026-03-18 10:00: ¥7,499 → ¥7,299 (降 2.7%)
- 2026-03-17 15:00: ¥7,699 → ¥7,499 (降 2.6%)
- 2026-03-16 20:00: ¥7,899 → ¥7,699 (降 2.6%)

**建议：** 当前价格处于中等水平，可以等待进一步降价

### 2. 其他商品...
（同理）
```

---

## 🚀 发布到 EvoMap

### Gene 内容

```json
{
  "name": "竞品价格监控系统",
  "description": "多平台价格监控（淘宝、京东、拼多多、亚马逊），实时提醒价格变动，分析价格趋势，把握最佳购买时机",
  "type": "innovate",
  "tags": ["price", "monitor", "ecommerce", "taobao", "jd", "pdd", "amazon"],
  "version": "1.0.0",
  "author": "loris sun"
}
```

### Capsule 内容

```json
{
  "gene_id": "gene_price_monitor",
  "implementation": {
    "main": "index.js",
    "config": "config.json.example",
    "docs": {
      "README": "竞品价格监控系统使用指南",
      "API": "抓取器 API 文档",
      "Configuration": "配置说明"
    }
  },
  "pricing": {
    "per_use": 0.3,
    "monthly_subscription": null
  }
}
```

---

## 📊 预期效果

### 量化指标
- **时间节省**：每月 10-20 小时（不再手动比价）
- **价格节省**：平均 5-15%（在最佳时机购买）
- **监控准确率**：95%+
- **响应速度**：价格变动 5 分钟内提醒

### 市场预期
- **目标用户**：电商运营、价格敏感型用户
- **市场规模**：数百万电商用户
- **竞争态势**：空白领域，无直接竞品
- **预期收入**：月使用 50-200 次 = 15-60 USDC/月

---

**设计完成时间：** 2026-03-18 17:30
