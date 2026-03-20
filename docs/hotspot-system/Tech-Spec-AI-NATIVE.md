# AI Native 热点地图 - 技术方案文档 (Tech Spec)

## 文档信息

- **项目名称:** AI Native 热点地图 (AI Native HotSpot Map)
- **版本:** v0.1 (MVP)
- **创建日期:** 2026-03-20
- **技术负责人:** loris sun
- **文档类型:** 技术方案 (Technical Specification)

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Web UI  │  │  Mobile  │  │  Desktop │  │  Widget  │  │
│  │ (React)  │  │ (React)  │  │ (Electron)│  │ (PWA)    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                            │
                    ┌───────▼───────┐
                    │  API Gateway  │
                    │  (Express)    │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼─────────┐  ┌─────▼────────┐
│  热点数据服务  │  │  AI 能力服务   │  │  用户数据服务  │
├────────────────┤  ├────────────────┤  ├──────────────┤
│ • 数据抓取     │  │ • 推荐引擎     │  │ • 用户管理     │
│ • 数据清洗     │  │ • 趋势预测     │  │ • 行为追踪     │
│ • 数据存储     │  │ • 内容摘要     │  │ • 兴趣模型     │
│ • 向量化       │  │ • 智能问答     │  │ • 推送通知     │
└───────┬────────┘  └────────┬───────┘  └──────┬───────┘
        │                    │                 │
┌───────▼────────┐  ┌────────▼─────────┐  ┌───▼────────┐
│ PostgreSQL DB  │  │  Vector DB       │  │  Redis     │
│ • hotspots     │  │  (Chroma/Pinecone)│  │ • Cache    │
│ • users       │  │  • embeddings    │  │ • Queue    │
│ • analytics    │  │  • chunks       │  │  • Session │
└────────────────┘  └──────────────────┘  └────────────┘
        │                    │                 │
        └────────────────────┴─────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼─────────┐  ┌─────▼────────┐
│  外部数据源    │  │  AI 模型服务   │  │  通知服务     │
├────────────────┤  ├────────────────┤  ├──────────────┤
│ • 小红书 API   │  │ • OpenAI       │  │ • 浏览器通知  │
│ • 微博 API     │  │ • Anthropic    │  │ • 移动推送    │
│ • 抖音 API     │  │ • 本地 LLM     │  │ • 邮件通知    │
│ • B站 API      │  │ • 本地 BERT    │  │ • 飞书通知    │
└────────────────┘  └────────────────┘  └──────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端** | React | 18.x | UI 框架 |
| | TypeScript | 5.x | 类型安全 |
| | Tailwind CSS | 3.x | UI 样式 |
| | Vite | 5.x | 构建工具 |
| | LangChain.js | - | AI 集成 |
| | React Query | - | 数据请求 |
| **后端** | Node.js | 20.x | 运行时 |
| | Express | 4.x | Web 框架 |
| | TypeScript | 5.x | 类型安全 |
| **数据库** | PostgreSQL | 15.x | 主数据库 |
| | Redis | 7.x | 缓存/队列 |
| | Chroma | - | 向量数据库 |
| **AI 模型** | OpenAI GPT-4 | - | 对话、摘要、问答 |
| | OpenAI text-embedding-3-small | - | 向量嵌入 |
| | XGBoost | - | 趋势预测 |
| | BERT/RoBERTa | - | 情感分析 |

---

## 2. 数据库设计

### 2.1 核心表结构

#### hotspots (热点表)

```sql
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  summary TEXT,  -- AI 摘要
  type VARCHAR(50),  -- food, tourism, event, acg, social_trend
  platform VARCHAR(50) NOT NULL,  -- xiaohongshu, weibo, douyin, bilibili
  platform_id VARCHAR(100) UNIQUE,  -- 平台原始 ID
  author VARCHAR(100),
  author_avatar TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255),

  -- 热度数据
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  plays_count INTEGER DEFAULT 0,
  collects_count INTEGER DEFAULT 0,

  -- AI 分析数据
  influence_score DECIMAL(3, 2),  -- 影响力评分 (0-1)
  predicted_burst_score DECIMAL(3, 2),  -- 预测爆发评分 (0-1)
  predicted_peak_time TIMESTAMP,  -- 预测峰值时间
  sentiment_score DECIMAL(3, 2),  -- 情感评分 (-1 to 1)
  sentiment_label VARCHAR(20),  -- positive, neutral, negative

  -- 时间数据
  published_at TIMESTAMP NOT NULL,
  crawled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  burst_at TIMESTAMP,  -- 爆发时间
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 标签
  tags TEXT[],  -- PostgreSQL 数组类型

  -- 状态
  status VARCHAR(20) DEFAULT 'active',  -- active, archived, deleted

  INDEX idx_type (type),
  INDEX idx_platform (platform),
  INDEX idx_city (city),
  INDEX idx_influence_score (influence_score),
  INDEX idx_predicted_burst_score (predicted_burst_score),
  INDEX idx_published_at (published_at),
  INDEX idx_status (status)
);
```

#### users (用户表)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  username VARCHAR(100),
  avatar TEXT,

  -- AI 用户画像
  interests TEXT[],  -- 兴趣标签
  behavior_profile JSONB,  -- 行为画像
  recommendation_score JSONB,  -- 推荐评分

  -- 偏好设置
  preferences JSONB DEFAULT '{}',

  -- 统计数据
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_ai_queries INTEGER DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_last_active_at (last_active_at)
);
```

#### user_behaviors (用户行为表)

```sql
CREATE TABLE user_behaviors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotspot_id UUID REFERENCES hotspots(id) ON DELETE CASCADE,

  -- 行为类型
  action_type VARCHAR(50) NOT NULL,  -- view, click, save, share, search, ai_query

  -- 上下文信息
  context JSONB DEFAULT '{}',  -- 包含搜索关键词、筛选条件等

  -- AI 推荐追踪
  recommendation_id UUID,  -- 推荐记录 ID
  is_recommended BOOLEAN DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_hotspot_id (hotspot_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at),
  INDEX idx_user_created (user_id, created_at)
);
```

#### recommendations (推荐记录表)

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,

  -- 推荐算法
  algorithm VARCHAR(50),  -- rule_based, collaborative, content_based, hybrid
  algorithm_version VARCHAR(20),

  -- 推荐评分
  score DECIMAL(5, 3),  -- 推荐评分 (0-1)

  -- 推荐原因
  reason JSONB,  -- {type: "interest", keywords: ["美食", "火锅"], score: 0.85}

  -- 效果追踪
  clicked BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,

  -- 时间
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  clicked_at TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_hotspot_id (hotspot_id),
  INDEX idx_algorithm (algorithm),
  INDEX idx_score (score),
  INDEX idx_created_at (created_at)
);
```

#### ai_queries (AI 查询记录表)

```sql
CREATE TABLE ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hotspot_id UUID REFERENCES hotspots(id) ON DELETE SET NULL,

  -- 查询类型
  query_type VARCHAR(50) NOT NULL,  -- summary, qna, comparison, recommendation

  -- 查询内容
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,

  -- AI 模型信息
  model VARCHAR(50) NOT NULL,  -- gpt-4, gpt-3.5-turbo
  model_version VARCHAR(20),
  tokens_used INTEGER,
  cost DECIMAL(10, 6),

  -- 质量评估
  user_rating INTEGER,  -- 1-5 星
  user_feedback TEXT,

  -- 时间
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,  -- 响应时间（毫秒）

  INDEX idx_user_id (user_id),
  INDEX idx_query_type (query_type),
  INDEX idx_created_at (created_at)
);
```

### 2.2 向量数据库设计

#### 向量集合：hotspot_embeddings

```javascript
{
  id: "hotspot_uuid",
  embedding: [0.123, -0.456, ...],  // 1536 维向量 (OpenAI text-embedding-3-small)
  metadata: {
    title: "成都最火的火锅店",
    type: "food",
    platform: "xiaohongshu",
    city: "成都",
    tags: ["火锅", "美食", "打卡"],
    summary: "这家火锅店位于春熙路，是最近成都最火的..."
  }
}
```

#### 向量集合：user_profiles

```javascript
{
  id: "user_uuid",
  embedding: [0.234, -0.567, ...],  // 基于用户行为生成的向量
  metadata: {
    interests: ["美食", "旅游", "ACG"],
    preferred_types: ["food", "tourism"],
    preferred_cities: ["成都", "重庆"],
    total_views: 150,
    total_clicks: 45
  }
}
```

---

## 3. API 设计

### 3.1 热点数据 API

#### GET /api/hotspots
获取热点列表（支持筛选、排序、分页）

**Query 参数:**
```javascript
{
  page: 1,              // 页码
  limit: 20,            // 每页数量
  type: "food",         // 类型筛选（可选）
  platform: "xiaohongshu",  // 平台筛选（可选）
  city: "成都",         // 城市筛选（可选）
  min_influence: 0.6,   // 最小影响力（可选）
  max_distance: 5,      // 最大距离（km，可选）
  sort_by: "influence", // 排序字段：influence, distance, predicted_burst
  sort_order: "desc"    // 排序方向：asc, desc
}
```

**响应:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "成都最火的火锅店",
      "summary": "AI 生成的摘要...",
      "type": "food",
      "platform": "xiaohongshu",
      "influence_score": 0.85,
      "predicted_burst_score": 0.92,
      "sentiment_score": 0.78,
      "latitude": 30.6586,
      "longitude": 104.0648,
      "distance": 2.3,  // 距离用户位置（km）
      "tags": ["火锅", "美食", "打卡"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

#### GET /api/hotspots/:id
获取热点详情

**响应:**
```json
{
  "id": "uuid",
  "title": "成都最火的火锅店",
  "content": "完整内容...",
  "summary": "AI 生成的摘要...",
  "author": "美食博主小王",
  "platform": "xiaohongshu",
  "city": "成都",
  "location_name": "春熙路",
  "latitude": 30.6586,
  "longitude": 104.0648,
  "influence_score": 0.85,
  "predicted_burst_score": 0.92,
  "predicted_peak_time": "2026-03-21T18:00:00Z",
  "sentiment_score": 0.78,
  "sentiment_label": "positive",
  "likes_count": 15000,
  "comments_count": 2300,
  "tags": ["火锅", "美食", "打卡"],
  "created_at": "2026-03-19T10:00:00Z"
}
```

### 3.2 AI 能力 API

#### POST /api/ai/recommendations
获取 AI 推荐的热点

**请求体:**
```json
{
  "user_id": "uuid",
  "context": {
    "location": {"latitude": 30.6586, "longitude": 104.0648},
    "time_of_day": "evening",
    "day_of_week": "friday",
    "recent_actions": ["view_food", "search_cafe"]
  },
  "limit": 10
}
```

**响应:**
```json
{
  "data": [
    {
      "hotspot_id": "uuid",
      "score": 0.92,
      "reason": {
        "type": "interest_match",
        "keywords": ["美食", "火锅"],
        "explanation": "您最近经常查看美食类内容，且这家火锅店即将爆发"
      }
    }
  ],
  "algorithm": "hybrid",
  "algorithm_version": "v1.0"
}
```

#### POST /api/ai/summary
生成热点摘要

**请求体:**
```json
{
  "hotspot_id": "uuid",
  "style": "concise"  // concise, detailed, highlight
}
```

**响应:**
```json
{
  "summary": "【核心卖点】1. 位于春熙路核心商圈，交通便利 2. 牛油锅底正宗，辣而不燥 3. 人均消费 80 元，性价比高\n【适合人群】喜欢川味火锅的朋友\n【预估成本】人均 80 元，排队约 30 分钟\n【注意事项】周末排队较长，建议提前预约\n【值得去吗】⭐⭐⭐⭐⭐ 强烈推荐，成都必打卡",
  "model": "gpt-4",
  "tokens_used": 256,
  "cost": 0.005
}
```

#### POST /api/ai/qna
智能问答

**请求体:**
```json
{
  "hotspot_id": "uuid",
  "question": "这个火锅店适合带女朋友去吗？",
  "conversation_id": "uuid"  // 多轮对话时使用
}
```

**响应:**
```json
{
  "answer": "这家火锅店很适合带女朋友去，原因如下：1. 环境优雅，不像传统火锅店那么嘈杂 2. 有包间，私密性更好 3. 菜品精致，摆盘好看，适合拍照 4. 服务态度很好，不会让尴尬。建议晚上 7 点前到，避免排队太久。",
  "confidence": 0.85,
  "model": "gpt-4",
  "tokens_used": 384,
  "cost": 0.008
}
```

#### POST /api/ai/search
自然语言搜索

**请求体:**
```json
{
  "query": "找一些适合今晚约会的地方，不要太贵，安静一点",
  "context": {
    "location": {"latitude": 30.6586, "longitude": 104.0648},
    "time": "evening",
    "budget": "medium"
  },
  "limit": 10
}
```

**响应:**
```json
{
  "data": [
    {
      "hotspot_id": "uuid",
      "title": "法式小酒馆",
      "match_score": 0.93,
      "match_reason": "安静、适合约会、价格适中"
    }
  ],
  "understanding": {
    "intent": "search_dating_spot",
    "keywords": ["约会", "安静", "价格适中"],
    "constraints": ["budget:medium", "atmosphere:quiet"]
  }
}
```

#### GET /api/ai/predictions
获取热点趋势预测

**Query 参数:**
```javascript
{
  hotspot_ids: ["uuid1", "uuid2"]  // 热点 ID 列表
}
```

**响应:**
```json
{
  "data": [
    {
      "hotspot_id": "uuid1",
      "predicted_burst_score": 0.92,
      "predicted_peak_time": "2026-03-21T18:00:00Z",
      "growth_rate": 0.15,  // 每日增长率
      "confidence": 0.85
    }
  ]
}
```

### 3.3 用户数据 API

#### POST /api/users
创建用户

**请求体:**
```json
{
  "email": "user@example.com",
  "username": "用户名",
  "preferences": {
    "preferred_types": ["food", "tourism"],
    "preferred_cities": ["成都", "重庆"]
  }
}
```

**响应:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "用户名",
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### POST /api/users/:id/behaviors
记录用户行为

**请求体:**
```json
{
  "hotspot_id": "uuid",
  "action_type": "click",
  "context": {
    "recommendation_id": "uuid",
    "is_recommended": true
  }
}
```

#### GET /api/users/:id/profile
获取用户画像

**响应:**
```json
{
  "id": "uuid",
  "interests": ["美食", "旅游", "ACG"],
  "behavior_profile": {
    "preferred_types": ["food", "tourism"],
    "preferred_platforms": ["xiaohongshu", "weibo"],
    "preferred_cities": ["成都", "重庆"],
    "active_hours": [18, 19, 20, 21]
  },
  "recommendation_score": {
    "food": 0.85,
    "tourism": 0.72,
    "event": 0.45,
    "acg": 0.60
  }
}
```

---

## 4. AI 模型集成

### 4.1 OpenAI GPT-4 集成

#### 4.1.1 内容摘要

**Prompt 模板:**
```
你是一个热点内容摘要助手。请根据以下热点信息，生成一个简洁但信息丰富的摘要。

热点信息：
- 标题：{title}
- 内容：{content}
- 平台：{platform}
- 类型：{type}
- 城市：{city}

请按以下格式输出：
【核心卖点】（3-5 个亮点）
【适合人群】
【预估成本】（时间、金钱）
【注意事项】
【值得去吗】⭐⭐⭐⭐⭐ 强烈推荐

摘要要求：
1. 简洁明了，不超过 200 字
2. 提取核心价值，不只是罗列信息
3. 给出可行动的建议
4. 语气客观，但可以适度主观评价
```

**实现示例：**
```javascript
const openai = require('openai');

const client = new openai({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateSummary(hotspot) {
  const prompt = `
你是一个热点内容摘要助手。请根据以下热点信息，生成一个简洁但信息丰富的摘要。

热点信息：
- 标题：${hotspot.title}
- 内容：${hotspot.content}
- 平台：${hotspot.platform}
- 类型：${hotspot.type}
- 城市：${hotspot.city}

请按以下格式输出：
【核心卖点】（3-5 个亮点）
【适合人群】
【预估成本】（时间、金钱）
【注意事项】
【值得去吗】⭐⭐⭐⭐⭐ 强烈推荐

摘要要求：
1. 简洁明了，不超过 200 字
2. 提取核心价值，不只是罗列信息
3. 给出可行动的建议
4. 语气客观，但可以适度主观评价
`;

  const response = await client.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "你是一个专业的内容摘要助手。" },
      { role: "user", content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  return response.choices[0].message.content;
}
```

#### 4.1.2 智能问答

**Prompt 模板:**
```
你是一个热点智能问答助手。请根据热点信息和用户问题，提供准确、有用的回答。

热点信息：
- 标题：{title}
- 内容：{content}
- 摘要：{summary}
- 位置：{city} {location_name}
- 类型：{type}
- 作者：{author}
- 平台：{platform}

用户问题：{question}

回答要求：
1. 基于热点信息回答，不要编造
2. 如果信息不足，明确说明
3. 给出可行动的建议
4. 语气友好、专业
5. 长度不超过 300 字
```

#### 4.1.3 自然语言搜索

**Prompt 模板:**
```
你是一个自然语言搜索理解助手。请理解用户的搜索意图，提取关键信息。

用户查询：{query}
上下文信息：{context}

请按以下 JSON 格式输出：
{
  "intent": "search_intent",
  "keywords": ["keyword1", "keyword2"],
  "constraints": {
    "budget": "low/medium/high",
    "distance": "nearby/medium/far",
    "atmosphere": ["quiet", "lively"]
  },
  "explanation": "解释用户的真实需求"
}
```

### 4.2 向量嵌入

**生成热点嵌入：**
```javascript
async function generateHotspotEmbedding(hotspot) {
  const text = `${hotspot.title} ${hotspot.content} ${hotspot.tags.join(' ')}`;

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float"
  });

  return response.data[0].embedding;
}
```

**语义搜索：**
```javascript
async function semanticSearch(query, topK = 10) {
  // 生成查询向量
  const queryEmbedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
    encoding_format: "float"
  });

  // 在向量数据库中搜索
  const results = await chromaCollection.query({
    queryEmbeddings: [queryEmbedding.data[0].embedding],
    nResults: topK
  });

  return results;
}
```

### 4.3 趋势预测（XGBoost）

**特征工程：**
```python
import xgboost as xgb
import pandas as pd

# 特征列表
features = [
    'likes_count', 'shares_count', 'comments_count', 'plays_count',
    'influence_score', 'sentiment_score',
    'hour_of_day', 'day_of_week',
    'likes_growth_rate', 'comments_growth_rate',
    'author_followers_count', 'author_posts_count'
]

# 训练数据
X_train = train_data[features]
y_train = train_data['burst_score']

# 创建模型
model = xgb.XGBRegressor(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    objective='reg:squarederror'
)

# 训练模型
model.fit(X_train, y_train)

# 预测
predictions = model.predict(test_data[features])
```

### 4.4 情感分析（BERT）

**加载预训练模型：**
```python
from transformers import pipeline

# 加载情感分析模型
sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="bert-base-chinese",
    tokenizer="bert-base-chinese"
)

# 分析情感
def analyze_sentiment(text):
    result = sentiment_analyzer(text)[0]
    return {
        'label': result['label'],  # POSITIVE, NEGATIVE, NEUTRAL
        'score': result['score']
    }
```

---

## 5. 推荐算法设计

### 5.1 MVP 阶段：规则引擎

**推荐规则：**
```javascript
function recommendHotspots(userId, context, limit = 10) {
  // 1. 获取用户画像
  const user = getUserProfile(userId);

  // 2. 获取候选热点
  const candidates = getCandidateHotspots(context);

  // 3. 应用规则评分
  const scored = candidates.map(hotspot => {
    let score = 0;
    let reasons = [];

    // 规则 1：兴趣匹配
    if (hotspot.type === user.interests[0]) {
      score += 0.3;
      reasons.push('兴趣匹配');
    }

    // 规则 2：城市偏好
    if (hotspot.city === user.preferred_cities[0]) {
      score += 0.2;
      reasons.push('城市偏好');
    }

    // 规则 3：即将爆发
    if (hotspot.predicted_burst_score > 0.8) {
      score += 0.25;
      reasons.push('即将爆发');
    }

    // 规则 4：距离近
    if (hotspot.distance < 5) {
      score += 0.15;
      reasons.push('距离近');
    }

    // 规则 5：情感好
    if (hotspot.sentiment_score > 0.7) {
      score += 0.1;
      reasons.push('口碑好');
    }

    return {
      hotspot,
      score,
      reasons
    };
  });

  // 4. 排序并返回
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
```

### 5.2 v0.2 阶段：混合推荐

**协同过滤：**
```javascript
async function collaborativeFiltering(userId, topK = 10) {
  // 1. 找到相似用户
  const similarUsers = await findSimilarUsers(userId);

  // 2. 获取相似用户喜欢但当前用户未看过的热点
  const recommendations = [];
  for (const similarUser of similarUsers) {
    const userHotspots = await getUserHotspots(similarUser.id);
    const currentUserHotspots = await getUserHotspots(userId);

    // 差集
    const newHotspots = userHotspots.filter(h =>
      !currentUserHotspots.includes(h.id)
    );

    recommendations.push(...newHotspots);
  }

  // 3. 去重并排序
  const uniqueHotspots = Array.from(new Set(recommendations));
  return uniqueHotspots.slice(0, topK);
}
```

**内容过滤：**
```javascript
async function contentFiltering(userId, topK = 10) {
  // 1. 获取用户向量
  const userEmbedding = await getUserEmbedding(userId);

  // 2. 计算与所有热点的相似度
  const hotspots = await getAllHotspots();
  const scored = hotspots.map(hotspot => {
    const hotspotEmbedding = await getHotspotEmbedding(hotspot.id);
    const similarity = cosineSimilarity(userEmbedding, hotspotEmbedding);
    return {
      hotspot,
      score: similarity
    };
  });

  // 3. 排序并返回
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
```

**混合推荐：**
```javascript
async function hybridRecommendation(userId, context, limit = 10) {
  // 1. 获取多种推荐结果
  const ruleBased = recommendHotspots(userId, context, limit * 2);
  const collabFilter = await collaborativeFiltering(userId, limit * 2);
  const contentFilter = await contentFiltering(userId, limit * 2);

  // 2. 加权融合
  const weights = {
    ruleBased: 0.4,
    collaborative: 0.3,
    contentBased: 0.3
  };

  // 3. 合并并重新评分
  const merged = new Map();

  for (const item of ruleBased) {
    merged.set(item.hotspot.id, {
      hotspot: item.hotspot,
      score: item.score * weights.ruleBased
    });
  }

  for (const item of collabFilter) {
    const existing = merged.get(item.hotspot.id);
    if (existing) {
      existing.score += item.score * weights.collaborative;
    } else {
      merged.set(item.hotspot.id, {
        hotspot: item.hotspot,
        score: item.score * weights.collaborative
      });
    }
  }

  for (const item of contentFilter) {
    const existing = merged.get(item.hotspot.id);
    if (existing) {
      existing.score += item.score * weights.contentBased;
    } else {
      merged.set(item.hotspot.id, {
        hotspot: item.hotspot,
        score: item.score * weights.contentBased
      });
    }
  }

  // 4. 排序并返回
  const results = Array.from(merged.values());
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
```

---

## 6. 前端架构

### 6.1 项目结构

```
ai-hotspot-map/
├── src/
│   ├── components/         # React 组件
│   │   ├── layout/        # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── map/           # 地图组件
│   │   │   ├── MapView.tsx
│   │   │   ├── HotspotMarker.tsx
│   │   │   └── UserLocation.tsx
│   │   ├── ai/            # AI 组件
│   │   │   ├── AIChat.tsx
│   │   │   ├── AIRecommendations.tsx
│   │   │   ├── AISummary.tsx
│   │   │   └── AIComparison.tsx
│   │   └── common/        # 通用组件
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Modal.tsx
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useAI.ts       # AI 能力 Hook
│   │   ├── useMap.ts      # 地图 Hook
│   │   └── useUser.ts     # 用户 Hook
│   ├── services/          # API 服务
│   │   ├── hotspotApi.ts
│   │   ├── aiApi.ts
│   │   └── userApi.ts
│   ├── stores/            # 状态管理
│   │   ├── hotspotStore.ts
│   │   ├── userStore.ts
│   │   └── uiStore.ts
│   ├── utils/             # 工具函数
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/             # TypeScript 类型
│   │   ├── hotspot.ts
│   │   ├── user.ts
│   │   └── ai.ts
│   ├── App.tsx            # 主应用
│   └── main.tsx           # 入口文件
├── public/                # 静态资源
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### 6.2 核心 Hooks

#### useAI.ts
```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiApi } from '@/services/aiApi';

export function useAI() {
  // AI 推荐
  const {
    data: recommendations,
    isLoading: isRecommendationsLoading,
    mutate: getRecommendations
  } = useMutation({
    mutationFn: (params) => aiApi.getRecommendations(params)
  });

  // AI 摘要
  const {
    data: summary,
    isLoading: isSummaryLoading,
    mutate: getSummary
  } = useMutation({
    mutationFn: (hotspotId) => aiApi.getSummary(hotspotId)
  });

  // AI 问答
  const {
    data: answer,
    isLoading: isAnswerLoading,
    mutate: askQuestion
  } = useMutation({
    mutationFn: (params) => aiApi.askQuestion(params)
  });

  // 自然语言搜索
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    mutate: naturalSearch
  } = useMutation({
    mutationFn: (query) => aiApi.naturalSearch(query)
  });

  return {
    recommendations,
    isRecommendationsLoading,
    getRecommendations,
    summary,
    isSummaryLoading,
    getSummary,
    answer,
    isAnswerLoading,
    askQuestion,
    searchResults,
    isSearchLoading,
    naturalSearch
  };
}
```

### 6.3 AI 组件示例

#### AIChat.tsx
```typescript
import React, { useState, useRef } from 'react';
import { useAI } from '@/hooks/useAI';

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { askQuestion, isAnswerLoading } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await askQuestion({
        question: userMessage,
        conversation_id: getConversationId()
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我遇到了一些问题。' }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问我关于热点的任何问题..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isAnswerLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isAnswerLoading ? '发送中...' : '发送'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 7. 后端架构

### 7.1 项目结构

```
ai-hotspot-map-backend/
├── src/
│   ├── controllers/       # 控制器
│   │   ├── hotspotController.ts
│   │   ├── aiController.ts
│   │   └── userController.ts
│   ├── services/          # 业务逻辑
│   │   ├── hotspotService.ts
│   │   ├── aiService.ts
│   │   ├── recommendationService.ts
│   │   └── crawlerService.ts
│   ├── models/            # 数据模型
│   │   ├── Hotspot.ts
│   │   ├── User.ts
│   │   └── Recommendation.ts
│   ├── repositories/      # 数据访问
│   │   ├── hotspotRepository.ts
│   │   └── userRepository.ts
│   ├── middlewares/       # 中间件
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── utils/             # 工具函数
│   │   ├── openai.ts
│   │   ├── chroma.ts
│   │   └── validators.ts
│   ├── config/            # 配置
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── app.ts             # Express 应用
│   └── server.ts          # 服务器入口
├── tests/                 # 测试
├── package.json
└── tsconfig.json
```

### 7.2 AI 服务示例

#### aiService.ts
```typescript
import OpenAI from 'openai';
import { chromaClient } from './chroma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  async generateSummary(hotspot: Hotspot): Promise<string> {
    const prompt = this.buildSummaryPrompt(hotspot);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '你是一个专业的内容摘要助手。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  async answerQuestion(params: {
    hotspot_id: string;
    question: string;
    conversation_id?: string;
  }): Promise<{ answer: string; confidence: number }> {
    const hotspot = await hotspotRepository.findById(params.hotspot_id);

    const prompt = this.buildQnaPrompt(hotspot, params.question);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '你是一个热点智能问答助手。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return {
      answer: response.choices[0].message.content,
      confidence: 0.85  // 简化，实际需要更复杂的置信度计算
    };
  }

  async naturalSearch(query: string, context: any): Promise<any[]> {
    // 1. 生成查询向量
    const embedding = await this.generateEmbedding(query);

    // 2. 在向量数据库中搜索
    const results = await chromaClient.query({
      collectionName: 'hotspots',
      queryEmbedding: embedding,
      nResults: 10
    });

    // 3. 使用 GPT-4 理解意图
    const understanding = await this.understandQuery(query, context);

    // 4. 结合语义搜索和意图理解
    return this.mergeSearchResults(results, understanding);
  }

  private buildSummaryPrompt(hotspot: Hotspot): string {
    return `
你是一个热点内容摘要助手。请根据以下热点信息，生成一个简洁但信息丰富的摘要。

热点信息：
- 标题：${hotspot.title}
- 内容：${hotspot.content}
- 平台：${hotspot.platform}
- 类型：${hotspot.type}
- 城市：${hotspot.city}

请按以下格式输出：
【核心卖点】（3-5 个亮点）
【适合人群】
【预估成本】（时间、金钱）
【注意事项】
【值得去吗】⭐⭐⭐⭐⭐ 强烈推荐

摘要要求：
1. 简洁明了，不超过 200 字
2. 提取核心价值，不只是罗列信息
3. 给出可行动的建议
4. 语气客观，但可以适度主观评价
`;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  }
}

export const aiService = new AIService();
```

---

## 8. 部署方案

### 8.1 开发环境

**前端：**
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**后端：**
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**数据库：**
```bash
# 启动 PostgreSQL
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# 启动 Redis
docker run --name redis -p 6379:6379 -d redis:7
```

**向量数据库：**
```bash
# Chroma（本地）
pip install chromadb
chroma-server --host localhost --port 8000
```

### 8.2 生产环境

#### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ai_hotspot_map
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/ai_hotspot_map
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

#### 云部署（Vercel + Railway）

**前端（Vercel）：**
```bash
vercel login
vercel --prod
```

**后端（Railway）：**
```bash
railway login
railway init
railway up
```

---

## 9. 开发计划

### 9.1 MVP 阶段 (v0.1) - 3 周

**第 1 周：基础架构**
- [ ] 前端 React + TypeScript + Vite 搭建
- [ ] 后端 Node.js + Express + TypeScript 搭建
- [ ] PostgreSQL 数据库设计和迁移
- [ ] Redis 缓存集成
- [ ] Chroma 向量数据库集成

**第 2 周：AI 能力集成**
- [ ] OpenAI GPT-4 API 集成
- [ ] 内容摘要功能
- [ ] 智能问答功能
- [ ] 自然语言搜索
- [ ] 向量嵌入生成和存储

**第 3 周：推荐算法和前端开发**
- [ ] 规则引擎推荐算法
- [ ] 前端 AI 组件开发
- [ ] 前端地图组件开发
- [ ] 前后端联调
- [ ] 测试和 Bug 修复

### 9.2 增强阶段 (v0.2) - 5 周

**第 1-2 周：推荐算法升级**
- [ ] 协同过滤算法
- [ ] 内容过滤算法
- [ ] 混合推荐算法
- [ ] 用户画像模型

**第 3-4 周：AI 能力增强**
- [ ] 趋势预测模型（XGBoost）
- [ ] 情感分析模型（BERT）
- [ ] 专题推荐功能
- [ ] 智能对比功能

**第 5 周：优化和部署**
- [ ] 性能优化
- [ ] 成本优化
- [ ] 生产环境部署
- [ ] 监控和日志

### 9.3 未来版本 (v0.3)

- [ ] 深度学习推荐模型
- [ ] 语音交互
- [ ] 社交分享 AI 文案生成
- [ ] 实时数据流（WebSocket）
- [ ] 移动端原生应用

---

## 10. 成本估算

### 10.1 AI 模型成本

| 模型 | 用途 | 每日调用 | 单次成本 | 每月成本 |
|------|------|----------|----------|----------|
| GPT-4 | 摘要、问答 | 1000 | $0.03 | $900 |
| text-embedding-3-small | 向量嵌入 | 5000 | $0.00002 | $3 |
| XGBoost | 趋势预测 | 10000 | $0.001 | $300 |

**总计：** ~$1200/月（MVP 阶段）

### 10.2 基础设施成本

| 服务 | 规格 | 每月成本 |
|------|------|----------|
| Vercel（前端） | Hobby | $0 |
| Railway（后端） | Starter | $5 |
| Railway（PostgreSQL） | Starter | $5 |
| Railway（Redis） | Starter | $5 |
| Pinecone（向量 DB） | Starter | $70 |

**总计：** ~$85/月

### 10.3 优化策略

1. **缓存：** 使用 Redis 缓存 AI 响应，减少重复调用
2. **批量处理：** 批量生成嵌入，降低单次成本
3. **降级策略：** 高峰期降级到本地模型（GPT-3.5、Ollama）
4. **用户配额：** 限制每用户的 AI 调用次数

---

## 11. 风险和挑战

### 11.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| AI 成本超预算 | 高 | 中 | 缓存、降级、用户配额 |
| AI 响应慢 | 中 | 中 | 异步处理、流式响应 |
| 向量数据库性能瓶颈 | 中 | 低 | 分片、缓存、优化索引 |

### 11.2 产品风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| AI 推荐准确率低 | 高 | 中 | A/B 测试、持续优化 |
| 用户不使用 AI 功能 | 高 | 中 | UI 优化、引导教程 |

---

## 12. 附录

### 12.1 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/ai_hotspot_map
REDIS_URL=redis://localhost:6379

# AI 模型
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# 向量数据库
CHROMA_HOST=localhost
CHROMA_PORT=8000
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...

# 应用
NODE_ENV=production
PORT=3000
```

### 12.2 参考资料

- OpenAI API: https://platform.openai.com/docs
- Chroma: https://docs.trychroma.com/
- Pinecone: https://docs.pinecone.io/
- XGBoost: https://xgboost.readthedocs.io/
- Transformers: https://huggingface.co/docs/transformers

---

**文档结束**
