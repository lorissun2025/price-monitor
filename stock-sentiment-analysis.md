# 股票情绪分析系统

## 功能
- 监控社交媒体和财经论坛对某只股票的讨论
- 分析情绪倾向（正面/负面/中性）
- 生成情绪指数和趋势
- 提供关键观点摘要

## 数据源

### 主要来源
1. **雪球** - 专业投资者讨论
2. **百度贴吧** - 散户聚集地
3. **微博** - 短平快讨论
4. **东方财富股吧** - 老牌论坛

### 搜索关键词
- 股票代码（如：600519）
- 股票名称（如：茅台）
- 相关话题（如：茅台股价）

## 情绪分析算法

### 情绪词典法
```javascript
// 正面词汇
const positiveWords = [
  '上涨', '突破', '利好', '看好', '抄底', '牛市', '起飞',
  '暴涨', '暴涨', '强势', '推荐', '买入', '加仓', '持有',
  '业绩', '增长', '盈利', '分红', '高送转', '涨停'
];

// 负面词汇
const negativeWords = [
  '下跌', '暴跌', '利空', '割肉', '熊市', '腰斩',
  '跌停', '跳水', '弱势', '减持', '卖出', '清仓',
  '亏损', '下滑', '财务', '造假', '暴雷', '退市'
];

// 中性词汇
const neutralWords = [
  '震荡', '盘整', '观望', '整理', '横盘', '调整',
  '波动', '平稳', '不变', '持平'
];

// 情绪分数计算
function calculateSentiment(text) {
  const words = text.split(/\s+/);
  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) {
      score += 1;
      positiveCount++;
    } else if (negativeWords.includes(word)) {
      score -= 1;
      negativeCount++;
    }
  });

  return {
    score,
    positiveCount,
    negativeCount,
    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    confidence: Math.abs(score) / words.length
  };
}
```

### LLM 情绪分析
```javascript
async function analyzeWithLLM(text) {
  const prompt = `
分析以下关于股票的讨论内容，评估情绪倾向：

内容：${text}

请返回 JSON 格式：
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0-1,
  "key_points": ["主要观点1", "主要观点2"],
  "overall_score": -1 to 1
}

其中：
- overall_score: -1 表示极度负面，1 表示极度正面，0 表示中性
- sentiment: 根据分数判断情绪倾向
- confidence: 分析的置信度
- key_points: 提取 3-5 个关键观点
`;

  const result = await llm.generate(prompt);
  return JSON.parse(result);
}
```

## 情绪指数计算

```javascript
class StockSentimentTracker {
  constructor() {
    this.history = []; // 历史情绪记录
    this.currentSentiment = 0;
    this.trend = 'stable';
  }

  // 更新当前情绪
  updateSentiment(sentiments) {
    // 计算加权平均（新数据权重更高）
    const weightedSum = sentiments.reduce((sum, s, i) => {
      const weight = i + 1; // 越新的数据权重越大
      return sum + s.overall_score * weight;
    }, 0);
    const totalWeight = sentiments.reduce((sum, _, i) => sum + i + 1, 0);

    this.currentSentiment = weightedSum / totalWeight;

    // 分析趋势
    if (this.history.length >= 3) {
      const recent = this.history.slice(-3);
      const trend = recent[2] - recent[0];
      if (trend > 0.3) this.trend = 'rising';
      else if (trend < -0.3) this.trend = 'falling';
      else this.trend = 'stable';
    }

    // 保存历史
    this.history.push({
      timestamp: Date.now(),
      sentiment: this.currentSentiment,
      trend: this.trend
    });

    // 只保留最近 30 天
    if (this.history.length > 30) {
      this.history.shift();
    }
  }

  // 生成报告
  generateReport() {
    return {
      currentSentiment: this.currentSentiment,
      sentimentLabel: this.getSentimentLabel(this.currentSentiment),
      trend: this.trend,
      trendLabel: this.getTrendLabel(this.trend),
      historicalData: this.history,
      recommendation: this.getRecommendation()
    };
  }

  getSentimentLabel(score) {
    if (score > 0.5) return '极度乐观';
    if (score > 0.2) return '乐观';
    if (score > -0.2) return '中性';
    if (score > -0.5) return '悲观';
    return '极度悲观';
  }

  getTrendLabel(trend) {
    switch (trend) {
      case 'rising': return '情绪上升 📈';
      case 'falling': return '情绪下降 📉';
      default: return '情绪稳定 ➡️';
    }
  }

  getRecommendation() {
    if (this.currentSentiment > 0.5 && this.trend === 'rising') {
      return '市场情绪极度乐观，注意风险！⚠️';
    } else if (this.currentSentiment > 0.2 && this.trend === 'rising') {
      return '市场情绪乐观，可以关注。👀';
    } else if (this.currentSentiment < -0.5 && this.trend === 'falling') {
      return '市场情绪极度悲观，可能存在机会！💡';
    } else if (this.currentSentiment < -0.2 && this.trend === 'falling') {
      return '市场情绪悲观，建议观望。⏳';
    } else {
      return '市场情绪中性，保持谨慎。🎯';
    }
  }
}
```

## 使用示例

### 1. 监控茅台（600519）
```javascript
const tracker = new StockSentimentTracker();

// 搜索并分析
const sentiments = await analyzeStockSentiment('600519 茅台');

// 更新情绪
tracker.updateSentiment(sentiments);

// 生成报告
const report = tracker.generateReport();
console.log(report);

/*
输出：
{
  currentSentiment: 0.3,
  sentimentLabel: '乐观',
  trend: 'rising',
  trendLabel: '情绪上升 📈',
  historicalData: [...],
  recommendation: '市场情绪乐观，可以关注。👀'
}
*/
```

### 2. 多只股票对比
```javascript
const stocks = [
  { code: '600519', name: '茅台' },
  { code: '000858', name: '五粮液' },
  { code: '600036', name: '招商银行' }
];

for (const stock of stocks) {
  const sentiments = await analyzeStockSentiment(`${stock.code} ${stock.name}`);
  const tracker = new StockSentimentTracker();
  tracker.updateSentiment(sentiments);
  const report = tracker.generateReport();

  console.log(`${stock.name} (${stock.code}):`);
  console.log(`  情绪: ${report.sentimentLabel} (${report.currentSentiment.toFixed(2)})`);
  console.log(`  趋势: ${report.trendLabel}`);
  console.log(`  建议: ${report.recommendation}\n`);
}
```

## 技术实现

### 数据抓取
```javascript
// 使用 Firecrawl 抓取网页
async function fetchStockDiscussions(stockCode) {
  const urls = [
    `https://xueqiu.com/S${stockCode}`,
    `https://tieba.baidu.com/f?kw=${stockCode}`,
    `https://guba.eastmoney.com/list,${stockCode}.html`
  ];

  const discussions = [];

  for (const url of urls) {
    try {
      const result = await firecrawl.scrape(url);
      const content = result.markdown;

      // 提取讨论内容
      const posts = extractPosts(content);

      // 分析情绪
      const sentiments = posts.map(post =>
        analyzeWithLLM(post.content)
      );

      discussions.push(...sentiments);
    } catch (error) {
      console.error(`抓取失败: ${url}`, error);
    }
  }

  return discussions;
}
```

### 定期监控
```javascript
// 设置定时任务
setInterval(async () => {
  console.log('开始情绪分析...');

  for (const stock of watchedStocks) {
    const sentiments = await fetchStockDiscussions(stock.code);
    stockTracker.updateSentiment(sentiments);
    const report = stockTracker.generateReport();

    // 发送通知
    await sendNotification(report);
  }

  console.log('情绪分析完成');
}, 30 * 60 * 1000); // 每 30 分钟
```

## 精度优化

1. **数据源多样化** - 综合多个平台，避免单一偏差
2. **时序分析** - 跟踪情绪变化趋势
3. **去重过滤** - 去除重复/刷屏内容
4. **权重调整** - 大V/专家观点权重更高
5. **异常检测** - 识别异常情绪波动（如突发新闻）

## 风险提示

⚠️ **情绪分析不是投资建议！**
- 情绪指数仅供参考，不构成投资建议
- 情绪可能被操纵（水军、炒作）
- 市场情绪与股价可能背离
- 投资需谨慎，风险自担

---

## 应用场景

1. **短期交易辅助** - 情绪极端时注意风险
2. **长期投资参考** - 跟踪情绪长期趋势
3. **事件影响评估** - 新闻发布后观察情绪变化
4. **市场情绪监测** - 了解整体市场情绪
