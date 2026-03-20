# 价格监控提醒系统

## 功能
- 监控商品价格变化
- 设置目标价格（涨到 X 元时提醒 / 跌到 X 元时提醒）
- 支持百分比变化提醒（如：跌 10% 就买）
- 多平台支持（淘宝、京东、拼多多、亚马逊等）
- 推送提醒到飞书/微信/邮件

## 技术架构

### 价格获取
```javascript
class PriceFetcher {
  constructor() {
    this.fetchers = {
      'taobao': new TaobaoFetcher(),
      'jd': new JDFetcher(),
      'pinduoduo': new PinDDFetcher(),
      'amazon': new AmazonFetcher()
    };
  }

  async fetchPrice(url, platform) {
    const fetcher = this.fetchers[platform];
    if (!fetcher) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const price = await fetcher.fetch(url);
    return {
      url,
      platform,
      price: price.current,
      originalPrice: price.original,
      discount: price.discount,
      timestamp: Date.now()
    };
  }
}
```

### 淘宝价格获取
```javascript
class TaobaoFetcher {
  async fetch(url) {
    // 方法1：使用公开 API
    try {
      const itemId = this.extractItemId(url);
      const api = `https://h5api.m.taobao.com/hgw/mtop.taobao.wdetail.getitemdescx/v4.0?data=${itemId}`;
      const response = await fetch(api);
      const data = await response.json();
      return {
        current: data.data.price,
        original: data.data.originalPrice
      };
    } catch (error) {
      // 方法2：使用网页抓取
      const result = await firecrawl.scrape(url);
      const price = this.extractPriceFromHTML(result.markdown);
      return price;
    }
  }

  extractItemId(url) {
    const match = url.match(/id=(\d+)/);
    return match ? match[1] : null;
  }
}
```

### 京东价格获取
```javascript
class JDFetcher {
  async fetch(url) {
    const skuId = this.extractSkuId(url);
    const api = `https://p.3.cn/prices/mgets?skuIds=${skuId}&type=1`;
    const response = await fetch(api);
    const data = await response.json();

    return {
      current: data[0].p,
      original: data[0].m
    };
  }

  extractSkuId(url) {
    const match = url.match(/\/(\d+)\.html/);
    return match ? match[1] : null;
  }
}
```

## 价格监控核心

```javascript
class PriceMonitor {
  constructor() {
    this.watchedItems = [];
    this.alerts = [];
    this.priceHistory = new Map();
    this.checkInterval = 30 * 60 * 1000; // 30 分钟
  }

  addWatchItem(item) {
    /*
      item = {
        name: 'iPhone 15',
        url: 'https://...',
        platform: 'taobao',
        alertType: 'price_drop', // 'price_drop' | 'price_rise' | 'percent_change'
        targetPrice: 5999,
        targetPercent: 10, // 跌 10% 提醒
        notifyChannel: ['feishu', 'wechat'],
        lastNotified: null
      }
    */
    this.watchedItems.push(item);
    this.priceHistory.set(item.url, []);
  }

  async checkPrices() {
    console.log('开始检查价格...');

    for (const item of this.watchedItems) {
      try {
        // 获取当前价格
        const priceInfo = await this.fetchPrice(item);

        // 记录历史
        const history = this.priceHistory.get(item.url);
        history.push(priceInfo);

        // 只保留最近 30 天
        if (history.length > 1440) { // 30 天 * 48 次/天
          history.shift();
        }

        // 检查是否触发提醒
        const alert = this.checkAlert(item, priceInfo, history);

        if (alert) {
          await this.sendNotification(item, alert);
          item.lastNotified = Date.now();
        }

      } catch (error) {
        console.error(`检查失败: ${item.name}`, error);
      }
    }
  }

  checkAlert(item, currentPrice, history) {
    const previousPrice = history[history.length - 2] || history[0];

    switch (item.alertType) {
      case 'price_drop':
        if (currentPrice.price <= item.targetPrice) {
          return {
            type: 'price_drop',
            message: `${item.name} 跌到 ${currentPrice.price} 元了！目标：${item.targetPrice} 元`,
            currentPrice: currentPrice.price,
            targetPrice: item.targetPrice
          };
        }
        break;

      case 'price_rise':
        if (currentPrice.price >= item.targetPrice) {
          return {
            type: 'price_rise',
            message: `${item.name} 涨到 ${currentPrice.price} 元了！目标：${item.targetPrice} 元`,
            currentPrice: currentPrice.price,
            targetPrice: item.targetPrice
          };
        }
        break;

      case 'percent_change':
        if (previousPrice) {
          const change = ((currentPrice.price - previousPrice.price) / previousPrice.price) * 100;

          if (change <= -item.targetPercent) {
            return {
              type: 'price_drop_percent',
              message: `${item.name} 跌了 ${Math.abs(change).toFixed(2)}%！从 ${previousPrice.price} 跌到 ${currentPrice.price} 元`,
              percent: change,
              previousPrice: previousPrice.price,
              currentPrice: currentPrice.price
            };
          } else if (change >= item.targetPercent) {
            return {
              type: 'price_rise_percent',
              message: `${item.name} 涨了 ${change.toFixed(2)}%！从 ${previousPrice.price} 涨到 ${currentPrice.price} 元`,
              percent: change,
              previousPrice: previousPrice.price,
              currentPrice: currentPrice.price
            };
          }
        }
        break;
    }

    return null;
  }

  async sendNotification(item, alert) {
    const message = {
      title: '价格提醒 🚨',
      content: alert.message,
      item: item.name,
      url: item.url,
      timestamp: new Date().toISOString()
    };

    // 发送到多个渠道
    for (const channel of item.notifyChannel) {
      switch (channel) {
        case 'feishu':
          await this.sendToFeishu(message);
          break;
        case 'wechat':
          await this.sendToWechat(message);
          break;
        case 'email':
          await this.sendToEmail(message);
          break;
      }
    }

    console.log('已发送提醒:', message);
  }

  start() {
    this.interval = setInterval(() => {
      this.checkPrices();
    }, this.checkInterval);

    console.log('价格监控已启动，检查间隔:', this.checkInterval / 1000, '秒');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('价格监控已停止');
  }
}
```

## 使用示例

### 1. 监控 iPhone 价格
```javascript
const monitor = new PriceMonitor();

// 添加监控商品
monitor.addWatchItem({
  name: 'iPhone 15 Pro Max 256G',
  url: 'https://item.taobao.com/item.htm?id=123456789',
  platform: 'taobao',
  alertType: 'price_drop',
  targetPrice: 8999,
  notifyChannel: ['feishu', 'wechat']
});

// 启动监控
monitor.start();

// 30 分钟后自动检查，跌到 8999 就提醒
```

### 2. 监控比特币价格
```javascript
monitor.addWatchItem({
  name: '比特币',
  url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
  platform: 'crypto', // 自定义
  alertType: 'percent_change',
  targetPercent: 5, // 跌 5% 提醒
  notifyChannel: ['feishu']
});

// 跌 5% 就提醒买入
```

### 3. 监控多个商品
```javascript
const items = [
  {
    name: '小米 14',
    url: 'https://item.jd.com/123456789.html',
    platform: 'jd',
    alertType: 'price_drop',
    targetPrice: 2999,
    notifyChannel: ['feishu']
  },
  {
    name: 'Nike Air Jordan',
    url: 'https://item.taobao.com/item.htm?id=987654321',
    platform: 'taobao',
    alertType: 'percent_change',
    targetPercent: 20, // 打 8 折就提醒
    notifyChannel: ['wechat']
  }
];

items.forEach(item => monitor.addWatchItem(item));
monitor.start();
```

## 价格趋势分析

```javascript
class PriceTrendAnalyzer {
  constructor() {
    this.history = new Map();
  }

  analyzeTrend(url, days = 7) {
    const data = this.history.get(url);
    if (!data || data.length < 10) {
      return { trend: 'insufficient_data' };
    }

    // 获取最近 7 天的数据
    const recentData = data.slice(-days * 48); // 48 次/天

    // 计算趋势
    const first = recentData[0].price;
    const last = recentData[recentData.length - 1].price;
    const change = ((last - first) / first) * 100;

    let trend;
    if (change > 5) {
      trend = 'strong_up';
    } else if (change > 2) {
      trend = 'up';
    } else if (change > -2) {
      trend = 'stable';
    } else if (change > -5) {
      trend = 'down';
    } else {
      trend = 'strong_down';
    }

    return {
      trend,
      changePercent: change,
      firstPrice: first,
      lastPrice: last,
      minPrice: Math.min(...recentData.map(d => d.price)),
      maxPrice: Math.max(...recentData.map(d => d.price)),
      recommendation: this.getRecommendation(trend, change)
    };
  }

  getRecommendation(trend, change) {
    switch (trend) {
      case 'strong_up':
        return '📈 价格强势上涨，建议观望';
      case 'up':
        return '📊 价格上涨，考虑等待回调';
      case 'stable':
        return '➡️ 价格稳定，可考虑入手';
      case 'down':
        return '📉 价格下跌，关注反弹机会';
      case 'strong_down':
        return '💥 价格大幅下跌，可能是入手时机';
      default:
        return '⏳ 数据不足，继续观察';
    }
  }
}
```

## 防反爬策略

```javascript
class AntiDetectionManager {
  constructor() {
    this.requestDelay = 3000; // 3 秒延迟
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Mozilla/5.0 (X11; Linux x86_64)'
    ];
    this.proxyRotation = false;
    this.requestCount = 0;
  }

  async fetchWithDelay(url) {
    // 随机延迟，避免规律
    const delay = this.requestDelay + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 随机 User-Agent
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });

    this.requestCount++;

    // 每 100 次请求后暂停
    if (this.requestCount % 100 === 0) {
      console.log('达到请求上限，暂停 5 分钟...');
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }

    return response;
  }
}
```

## 飞书通知集成

```javascript
async function sendToFeishu(message) {
  // 使用 feishu-doc skill 发送到飞书
  await feishuDoc.write({
    title: '价格提醒',
    content: message.content,
    parent_id: 'folder_id_for_notifications'
  });
}
```

## 使用场景

1. **电商大促监控** - 双11、618 监控心仪商品
2. **订阅价格变化** - 软件订阅涨价/降价提醒
3. **理财产品监控** - 银行利率、理财产品变化
4. **虚拟商品监控** - 游戏皮肤、会员降价
5. **旅行价格监控** - 机票、酒店价格追踪

## 精度优化

1. **智能检查频率**
   - 大促期间：每 10 分钟
   - 平时：每 30 分钟
   - 低价商品：每 5 分钟

2. **去重提醒**
   - 同一商品 24 小时内不重复提醒

3. **价格波动过滤**
   - 忽略小于 1% 的波动

4. **多源验证**
   - 同一商品在多个平台对比

## 存储结构

```json
{
  "watched_items": [
    {
      "id": "unique_id",
      "name": "商品名称",
      "url": "https://...",
      "platform": "taobao",
      "alert_type": "price_drop",
      "target_price": 5999,
      "notify_channel": ["feishu"],
      "created_at": "2026-03-10T10:00:00Z",
      "last_checked": "2026-03-10T10:30:00Z",
      "last_notified": null
    }
  ],
  "price_history": {
    "unique_id": [
      {
        "price": 5999,
        "timestamp": "2026-03-10T10:00:00Z"
      },
      {
        "price": 5899,
        "timestamp": "2026-03-10T10:30:00Z"
      }
    ]
  }
}
```

---

## 风险提示

⚠️ **价格监控仅供参考**
- 价格可能不准确，以实际购买页面为准
- 提醒可能有延迟
- 价格可能随时变化
- 部分平台可能屏蔽爬虫

---

## 可扩展性

可以轻松添加新平台：
```javascript
class CustomFetcher {
  async fetch(url) {
    const result = await firecrawl.scrape(url);
    return this.extractPrice(result.markdown);
  }

  extractPrice(html) {
    // 自定义价格提取逻辑
    // ...
  }
}

// 注册到 PriceFetcher
priceFetcher.fetchers['custom'] = new CustomFetcher();
```
