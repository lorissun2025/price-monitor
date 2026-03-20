# 新闻摘要机器人

## 功能
- 自动抓取科技、财经等新闻
- AI 智能摘要（每条新闻 3-5 句话）
- 分类整理（科技、财经、国际、娱乐等）
- 早报+晚报推送
- 支持自定义关键词过滤
- 支持多语言（中英文）

## 技术架构

### 新闻源配置
```javascript
const NEWS_SOURCES = {
  'tech': [
    {
      name: '36氪',
      url: 'https://36kr.com',
      rss: 'https://36kr.com/feed',
      language: 'zh'
    },
    {
      name: '虎嗅',
      url: 'https://huxiu.com',
      rss: 'https://huxiu.com/rss',
      language: 'zh'
    },
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      rss: 'https://techcrunch.com/feed/',
      language: 'en'
    }
  ],
  'finance': [
    {
      name: '财新网',
      url: 'https://caixin.com',
      rss: 'https://caixin.com/rss',
      language: 'zh'
    },
    {
      name: '东方财富',
      url: 'https://eastmoney.com',
      rss: 'https://finance.eastmoney.com/rss/index.xml',
      language: 'zh'
    }
  ],
  'international': [
    {
      name: 'BBC 中文',
      url: 'https://bbc.com/zhongwen',
      rss: 'https://feeds.bbci.co.uk/zhongwen/simp_chinese/rss.xml',
      language: 'zh'
    }
  ]
};
```

### 新闻抓取器
```javascript
class NewsFetcher {
  constructor() {
    this.sources = NEWS_SOURCES;
    this.cache = new Map();
    this.cacheDuration = 30 * 60 * 1000; // 30 分钟
  }

  async fetchFromRSS(source) {
    // 检查缓存
    const cached = this.cache.get(source.rss);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    // 抓取 RSS
    const response = await fetch(source.rss);
    const xml = await response.text();

    // 解析 XML
    const items = this.parseRSSXML(xml, source.language);

    // 缓存结果
    this.cache.set(source.rss, {
      timestamp: Date.now(),
      data: items
    });

    return items;
  }

  parseRSSXML(xml, language) {
    const items = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    const entries = xmlDoc.querySelectorAll('item');

    entries.forEach(entry => {
      const title = entry.querySelector('title').textContent;
      const link = entry.querySelector('link').textContent;
      const pubDate = entry.querySelector('pubDate').textContent;
      const description = entry.querySelector('description').textContent;

      items.push({
        title: this.cleanText(title),
        link,
        pubDate: new Date(pubDate),
        description: this.cleanText(description),
        source: language,
        category: this.detectCategory(title, description)
      });
    });

    return items;
  }

  cleanText(text) {
    // 去除 HTML 标签
    return text.replace(/<[^>]+>/g, '').trim();
  }

  detectCategory(title, description) {
    const content = (title + ' ' + description).toLowerCase();

    if (content.includes('股票') || content.includes('股市') || content.includes('基金')) {
      return 'finance';
    } else if (content.includes('AI') || content.includes('人工智能') || content.includes('科技')) {
      return 'tech';
    } else if (content.includes('政治') || content.includes('国际')) {
      return 'international';
    } else {
      return 'general';
    }
  }

  async fetchAll() {
    const allNews = [];

    for (const category in this.sources) {
      for (const source of this.sources[category]) {
        try {
          const items = await this.fetchFromRSS(source);
          allNews.push(...items);
        } catch (error) {
          console.error(`抓取失败: ${source.name}`, error);
        }
      }
    }

    // 按时间排序
    return allNews.sort((a, b) => b.pubDate - a.pubDate);
  }
}
```

### AI 摘要生成器
```javascript
class NewsSummarizer {
  constructor() {
    this.maxLength = 200; // 摘要最多 200 字
  }

  async summarize(newsItem) {
    const prompt = `
请为以下新闻生成简洁摘要，要求：
1. 3-5 句话
2. 突出关键信息
3. 使用简洁易懂的语言
4. 每句不超过 50 字

新闻标题：${newsItem.title}
新闻内容：${newsItem.description}
新闻链接：${newsItem.link}

返回格式：
{
  "summary": "摘要内容",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "sentiment": "positive|negative|neutral",
  "tags": ["标签1", "标签2"]
}
`;

    const result = await this.callLLM(prompt);
    return JSON.parse(result);
  }

  async summarizeBatch(newsItems) {
    const summaries = [];

    for (const item of newsItems) {
      try {
        const summary = await this.summarize(item);
        summaries.push({
          ...item,
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          sentiment: summary.sentiment,
          tags: summary.tags
        });

        // 避免请求太快
        await this.delay(1000);

      } catch (error) {
        console.error(`摘要失败: ${item.title}`, error);
        summaries.push({
          ...item,
          summary: item.description.substring(0, this.maxLength) + '...',
          keyPoints: [],
          sentiment: 'neutral',
          tags: []
        });
      }
    }

    return summaries;
  }

  async callLLM(prompt) {
    // 调用 LLM API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的新闻摘要助手，擅长提炼关键信息。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 新闻推送管理器
```javascript
class NewsPusher {
  constructor() {
    this.subscribers = new Map();
    this.schedule = {
      morning: '08:00',
      evening: '20:00'
    };
  }

  subscribe(userId, config) {
    /*
      config = {
        userId: 'user_id',
        name: 'loris',
        categories: ['tech', 'finance'], // 订阅哪些类别
        frequency: 'daily', // 'daily' | 'twice_daily' | 'realtime'
        keywords: ['AI', '区块链'], // 关键词过滤
        channels: ['feishu', 'wechat'], // 推送渠道
        lastSent: null
      }
    */
    this.subscribers.set(userId, config);
  }

  async pushMorningNews() {
    console.log('推送早报...');

    // 获取昨天的新闻
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const news = await this.fetchNews(yesterday);
    const summaries = await this.summarizeNews(news);

    // 推送给所有订阅者
    for (const [userId, config] of this.subscribers) {
      if (config.frequency === 'daily' || config.frequency === 'twice_daily') {
        const filtered = this.filterByCategories(summaries, config.categories);
        const filteredByKeywords = this.filterByKeywords(filtered, config.keywords);

        if (filteredByKeywords.length > 0) {
          await this.sendToUser(userId, {
            type: 'morning_report',
            date: new Date().toLocaleDateString('zh-CN'),
            news: filteredByKeywords.slice(0, 10) // 最多 10 条
          });

          config.lastSent = Date.now();
        }
      }
    }
  }

  async pushEveningNews() {
    console.log('推送晚报...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const news = await this.fetchNews(today);
    const summaries = await this.summarizeNews(news);

    for (const [userId, config] of this.subscribers) {
      if (config.frequency === 'twice_daily') {
        const filtered = this.filterByCategories(summaries, config.categories);
        const filteredByKeywords = this.filterByKeywords(filtered, config.keywords);

        if (filteredByKeywords.length > 0) {
          await this.sendToUser(userId, {
            type: 'evening_report',
            date: new Date().toLocaleDateString('zh-CN'),
            news: filteredByKeywords.slice(0, 10)
          });

          config.lastSent = Date.now();
        }
      }
    }
  }

  async fetchNews(date) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // 从缓存中获取该日期的新闻
    const allNews = [];
    for (const [_, cached] of newsCache) {
      if (cached.timestamp >= date.getTime() &&
          cached.timestamp < nextDay.getTime()) {
        allNews.push(...cached.data);
      }
    }

    return allNews;
  }

  filterByCategories(news, categories) {
    if (!categories || categories.length === 0) {
      return news;
    }
    return news.filter(item => categories.includes(item.category));
  }

  filterByKeywords(news, keywords) {
    if (!keywords || keywords.length === 0) {
      return news;
    }
    return news.filter(item => {
      const content = (item.title + ' ' + item.summary).toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
  }

  async sendToUser(userId, report) {
    const content = this.generateReportContent(report);

    // 发送到多个渠道
    const userConfig = this.subscribers.get(userId);
    for (const channel of userConfig.channels) {
      switch (channel) {
        case 'feishu':
          await this.sendToFeishu(userId, content);
          break;
        case 'wechat':
          await this.sendToWechat(userId, content);
          break;
        case 'email':
          await this.sendToEmail(userId, content);
          break;
      }
    }
  }

  generateReportContent(report) {
    const emoji = report.type === 'morning_report' ? '🌅' : '🌙';

    let content = `
${emoji} ${report.type === 'morning_report' ? '早报' : '晚报'} | ${report.date}

`;

    report.news.forEach((item, index) => {
      const sentimentEmoji = {
        'positive': '📈',
        'negative': '📉',
        'neutral': '📊'
      }[item.sentiment] || '📊';

      content += `
${index + 1}. ${item.title}
${sentimentEmoji} ${item.summary}
${item.tags.map(tag => `#${tag}`).join(' ')}

`;
    });

    return content;
  }
}
```

### 定时任务调度
```javascript
class NewsScheduler {
  constructor() {
    this.fetcher = new NewsFetcher();
    this.summarizer = new NewsSummarizer();
    this.pusher = new NewsPusher();

    this.tasks = {
      // 每 30 分钟抓取新闻
      fetchNews: {
        interval: 30 * 60 * 1000,
        run: () => this.fetchAndCacheNews()
      },
      // 早报推送
      morningPush: {
        time: '08:00',
        run: () => this.pusher.pushMorningNews()
      },
      // 晚报推送
      eveningPush: {
        time: '20:00',
        run: () => this.pusher.pushEveningNews()
      }
    };
  }

  async fetchAndCacheNews() {
    console.log('抓取最新新闻...');
    const news = await this.fetcher.fetchAll();
    console.log(`抓取到 ${news.length} 条新闻`);

    // 缓存新闻
    newsCache.set(Date.now(), {
      timestamp: Date.now(),
      data: news
    });

    // 清理过期缓存（7 天）
    this.cleanCache();
  }

  cleanCache() {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const [key, cached] of newsCache) {
      if (cached.timestamp < weekAgo) {
        newsCache.delete(key);
      }
    }
  }

  start() {
    console.log('新闻机器人启动');

    // 启动新闻抓取
    setInterval(() => {
      this.tasks.fetchNews.run();
    }, this.tasks.fetchNews.interval);

    // 启动定时推送
    this.scheduleDailyTask(this.tasks.morningPush.time, this.tasks.morningPush.run);
    this.scheduleDailyTask(this.tasks.eveningPush.time, this.tasks.eveningPush.run);
  }

  scheduleDailyTask(time, callback) {
    const [hours, minutes] = time.split(':').map(Number);

    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
      // 如果今天已经过了，设置到明天
      target.setDate(target.getDate() + 1);
    }

    const delay = target - now;
    console.log(`设置定时任务: ${time}, 延迟 ${delay / 1000 / 60} 分钟`);

    setTimeout(() => {
      callback();
      // 每天重复
      setInterval(callback, 24 * 60 * 60 * 1000);
    }, delay);
  }
}

// 全局缓存
const newsCache = new Map();
```

## 使用示例

### 1. 启动机器人
```javascript
const scheduler = new NewsScheduler();
scheduler.start();

// 自动每 30 分钟抓取新闻
// 早报 8:00 推送
// 晚报 20:00 推送
```

### 2. 订阅新闻
```javascript
const pusher = new NewsPusher();

// 订阅早报和晚报
pusher.subscribe('user_loris', {
  name: 'loris',
  categories: ['tech', 'finance'],
  frequency: 'twice_daily',
  keywords: ['AI', '区块链', '腾讯', '茅台'],
  channels: ['feishu', 'wechat']
});

pusher.subscribe('user_xiaoming', {
  name: 'xiaoming',
  categories: ['tech'],
  frequency: 'daily',
  keywords: ['前端', 'JavaScript'],
  channels: ['feishu']
});
```

### 3. 手动获取摘要
```javascript
const summarizer = new NewsSummarizer();

const newsItem = {
  title: 'OpenAI 发布 GPT-5',
  link: 'https://example.com/gpt5',
  description: 'OpenAI 今天发布了 GPT-5，这是迄今最强大的 AI 模型...',
  pubDate: new Date()
};

const summary = await summarizer.summarize(newsItem);
console.log(summary);

/*
输出：
{
  summary: 'OpenAI 发布了 GPT-5，这是迄今最强大的 AI 模型。新模型在多项基准测试中超越前代。性能提升显著，成本降低。',
  keyPoints: ['GPT-5 发布', '性能超越前代', '成本降低'],
  sentiment: 'positive',
  tags: ['AI', 'GPT', 'OpenAI']
}
*/
```

## 报告模板

### 早报示例
```
🌅 早报 | 2026年3月10日

1. 腾讯发布元宇宙新功能
📈 腾讯在元宇宙领域推出新功能，支持 VR 设备。用户可以在虚拟空间中社交和娱乐。这是腾讯在元宇宙战略的重要布局。
#元宇宙 #腾讯

2. 茅台股价创新高
📈 茅台股价突破 1900 元大关，创历史新高。分析师认为这与公司业绩预期向好有关。白酒板块整体上涨。
#茅台 #股价

3. AI 监管新规发布
📊 国家发布 AI 监管新规，要求企业加强数据保护。新规对 AI 企业提出了更高合规要求。行业需适应新环境。
#AI #监管

...
```

### 晚报示例
```
🌙 晚报 | 2026年3月10日

1. 比特币价格大跌
📉 比特币价格跌破 60000 美元，创本月新低。市场情绪转冷，交易量增加。投资者保持谨慎。
#比特币 #加密货币

2. 新能源汽车销量创新高
📈 新能源汽车月销量突破 100 万台，同比增长 50%。政策支持和消费者接受度提高是主因。比亚迪、特斯拉领跑。
#新能源 #汽车

...
```

## 飞书通知集成

```javascript
async function sendToFeishu(userId, content) {
  // 创建早报/晚报文档
  await feishuDoc.create({
    title: `${new Date().toLocaleDateString('zh-CN')} 早报`,
    content: content,
    parent_id: 'folder_id_for_reports'
  });

  // 或者发送到飞书群聊
  await feishu.sendMessage({
    chat_id: 'feishu_chat_id',
    text: content
  });
}
```

## 功能扩展

### 1. 实时推送
```javascript
// 重大新闻实时推送
async function pushBreakingNews(newsItem) {
  const summary = await summarizer.summarize(newsItem);

  // 检查是否重大新闻
  if (summary.sentiment === 'positive' && summary.tags.includes('AI')) {
    for (const userId in pusher.subscribers) {
      await pusher.sendToUser(userId, {
        type: 'breaking_news',
        title: '⚠️ 突发新闻',
        content: summary.summary
      });
    }
  }
}
```

### 2. 自定义摘要风格
```javascript
// 幽默风格
const humorPrompt = `
用幽默的口吻生成新闻摘要，要求：
1. 轻松有趣
2. 加入网络流行语
3. 吐槽但不能太过分
4. 3-5 句话

新闻：${newsItem.title} ${newsItem.description}
`;

// 专业风格
const professionalPrompt = `
用专业的财经分析师口吻生成新闻摘要，要求：
1. 数据支撑
2. 市场影响分析
3. 投资建议
4. 3-5 句话

新闻：${newsItem.title} ${newsItem.description}
`;
```

### 3. 多语言支持
```javascript
const multilingualSummaries = await Promise.all([
  summarizer.summarize(newsItem, 'zh'), // 中文摘要
  summarizer.summarize(newsItem, 'en'), // 英文摘要
  summarizer.summarize(newsItem, 'ja')  // 日文摘要
]);
```

## 精度优化

1. **智能分类**
   - 使用 LLM 自动分类（更准确）
   - 用户反馈学习（纠正错误分类）

2. **去重机制**
   - 同一新闻从多个源抓取，只保留一条

3. **时效性过滤**
   - 只推送 24 小时内的新闻
   - 重大新闻可推送更久

4. **个性化推荐**
   - 根据用户阅读历史推荐

## 存储结构

```json
{
  "subscribers": {
    "user_loris": {
      "name": "loris",
      "categories": ["tech", "finance"],
      "frequency": "twice_daily",
      "keywords": ["AI", "区块链"],
      "channels": ["feishu"],
      "last_sent": "2026-03-10T08:00:00Z",
      "stats": {
        "total_sent": 150,
        "read_count": 120
      }
    }
  },
  "news_history": {
    "2026-03-10": [
      {
        "id": "news_id",
        "title": "新闻标题",
        "summary": "摘要",
        "link": "https://...",
        "pubDate": "2026-03-10T10:00:00Z",
        "category": "tech",
        "tags": ["AI", "GPT"]
      }
    ]
  }
}
```

---

## 使用场景

1. **日常阅读** - 每天早上/晚上看新闻摘要
2. **行业监控** - 监控 AI、区块链等行业动态
3. **股市参考** - 财经新闻辅助投资决策
4. **节省时间** - 不用刷多个新闻网站

## 注意事项

⚠️ **新闻机器人使用提示**
- 新闻摘要仅供参考，不代表机器人立场
- 请以官方发布为准
- 重要决策建议多方验证
- 避免过度依赖摘要信息
