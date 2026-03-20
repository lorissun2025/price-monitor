# 热点地图系统 API 设计文档

## 基础信息

- **版本：** v1.0
- **Base URL：** `/api`
- **数据格式：** JSON

---

## 接口列表

### 1. 获取热点列表

**接口：** `GET /hotspots`

**描述：** 获取所有热点数据，支持筛选和分页

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform | string | 否 | 平台筛选：`xiaohongshu`, `weibo`, `douyin`, `bilibili` |
| type | string | 否 | 类型筛选：`food`, `tourism`, `event`, `acg`, `social_trend` |
| city | string | 否 | 城市筛选：`北京`, `上海`, `广州`, `深圳`, `杭州`, `成都` |
| minScore | number | 否 | 最小影响力评分 (0-1) |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 50，最大 100 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "total": 23,
    "page": 1,
    "limit": 50,
    "hotspots": [
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
    ]
  }
}
```

---

### 2. 获取热点详情

**接口：** `GET /hotspots/:id`

**描述：** 根据热点 ID 获取详细信息

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 热点 ID |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "xhs_001",
    "platform": "xiaohongshu",
    "title": "三里屯网红咖啡厅，必打卡！",
    "type": "food",
    "influenceScore": 0.85,
    "influenceLevel": "very_high",
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
    },
    "relatedPlatforms": ["douyin"]
  }
}
```

---

### 3. 搜索热点

**接口：** `GET /hotspots/search`

**描述：** 按关键词搜索热点

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| platform | string | 否 | 平台筛选 |
| type | string | 否 | 类型筛选 |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "hotspots": [
      {
        "id": "xhs_001",
        "title": "三里屯网红咖啡厅，必打卡！",
        "platform": "xiaohongshu",
        "type": "food",
        "influenceScore": 0.85,
        "location": {
          "lat": 39.9370,
          "lng": 116.4477,
          "city": "北京",
          "district": "朝阳区"
        }
      }
    ]
  }
}
```

---

### 4. 获取统计数据

**接口：** `GET /stats`

**描述：** 获取热点统计数据

**响应示例：**

```json
{
  "success": true,
  "data": {
    "total": 23,
    "lastUpdate": "2026-03-12T09:00:00Z",
    "byPlatform": {
      "xiaohongshu": 7,
      "weibo": 7,
      "douyin": 6,
      "bilibili": 3
    },
    "byType": {
      "food": 5,
      "tourism": 8,
      "event": 2,
      "acg": 3,
      "social_trend": 5
    },
    "byCity": {
      "北京": 6,
      "上海": 5,
      "深圳": 4,
      "广州": 3,
      "杭州": 3,
      "成都": 2
    },
    "byInfluence": {
      "very_high": 3,
      "high": 8,
      "medium": 7,
      "low": 4,
      "emerging": 1
    }
  }
}
```

---

### 5. 触发数据更新

**接口：** `POST /fetch`

**描述：** 触发数据抓取任务（管理员权限）

**响应示例：**

```json
{
  "success": true,
  "message": "数据抓取任务已启动",
  "taskId": "fetch_20260312_123456",
  "estimatedTime": 30
}
```

---

### 6. 获取抓取任务状态

**接口：** `GET /fetch/status/:taskId`

**描述：** 获取数据抓取任务状态

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskId | string | 是 | 任务 ID |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "taskId": "fetch_20260312_123456",
    "status": "running",
    "progress": 45,
    "platforms": {
      "xiaohongshu": "completed",
      "weibo": "running",
      "douyin": "pending",
      "bilibili": "pending"
    }
  }
}
```

---

## 错误响应

所有接口在出错时返回统一格式：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "无效的参数",
    "details": "platform 参数必须是有效的平台名称"
  }
}
```

### 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| INVALID_PARAMETER | 400 | 参数错误 |
| NOT_FOUND | 404 | 资源不存在 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 禁止访问 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 分页规范

**请求参数：**
- `page`: 页码，从 1 开始
- `limit`: 每页数量，默认 50，最大 100

**响应结构：**
```json
{
  "success": true,
  "data": {
    "total": 23,
    "page": 1,
    "limit": 50,
    "hasNext": false,
    "items": [...]
  }
}
```

---

## 缓存策略

- **热点列表缓存：** 5 分钟
- **热点详情缓存：** 10 分钟
- **统计数据缓存：** 1 分钟

---

## 速率限制

- **未认证用户：** 100 请求/分钟
- **认证用户：** 300 请求/分钟
- **管理员：** 无限制

---

## 版本历史

- **v1.0 (2026-03-12):** 初始版本，包含基础 CRUD 和搜索功能
