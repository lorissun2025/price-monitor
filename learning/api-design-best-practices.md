# API 设计最佳实践学习笔记

**学习时间：** 2026-03-23
**学习主题：** REST API 设计最佳实践

---

## 一、REST API 基础

### 什么是 REST API？

**REST（Representational State Transfer）** 是一种软件架构风格，用于设计网络应用。

**核心原则：**
1. **无状态** - 每个请求包含所有信息
2. **统一接口** - 使用标准的 HTTP 方法和状态码
3. **资源导向** - 一切皆是资源（URL）
4. **分层系统** - 客户端不需要知道是连接到服务器还是中间层

---

## 二、URL 设计规范

### 1. 资源命名

**原则：使用名词，复数形式**

```javascript
// ❌ 错误
/getUsers
/getAllUsers
/createUser
/deleteUser/1

// ✅ 正确
GET    /users        # 获取用户列表
GET    /users/1      # 获取单个用户
POST   /users        # 创建用户
PUT    /users/1      # 更新用户（全量）
PATCH  /users/1      # 更新用户（部分）
DELETE /users/1      # 删除用户
```

**示例：**

```javascript
// 用户相关
GET    /users              # 获取用户列表
GET    /users/{id}         # 获取单个用户
POST   /users              # 创建用户
PUT    /users/{id}         # 更新用户
DELETE /users/{id}         # 删除用户

// 用户订单（嵌套资源）
GET    /users/{id}/orders  # 获取用户的订单
POST   /users/{id}/orders  # 为用户创建订单

// 订单相关
GET    /orders             # 获取订单列表
GET    /orders/{id}        # 获取单个订单
```

### 2. URL 层级深度

**原则：不要超过 3 层**

```javascript
// ✅ 推荐（2-3 层）
GET    /users/{id}/orders
GET    /users/{id}/orders/{orderId}/items

// ❌ 不推荐（超过 3 层）
GET    /users/{id}/orders/{orderId}/items/{itemId}/reviews

// ✅ 改为平铺
GET    /reviews?orderItemId={itemId}
```

### 3. 查询参数和过滤

**原则：使用查询参数进行过滤、排序、分页**

```javascript
// 过滤
GET    /users?status=active
GET    /users?role=admin&status=active
GET    /users?createdAfter=2024-01-01

// 排序
GET    /users?sort=name          # 升序
GET    /users?sort=-name         # 降序（负号）
GET    /users?sort=name,email    # 多字段排序

// 分页
GET    /users?page=1&limit=20
GET    /users?offset=0&limit=20
GET    /users?page=1&perPage=20

// 搜索
GET    /users?q=张三
GET    /hotspots?search=故宫

// 字段选择（减少数据传输）
GET    /users?fields=id,name,email
GET    /hotspots?fields=id,title,lat,lng
```

### 4. 版本控制

**原则：通过 URL 路径进行版本控制**

```javascript
// ✅ 推荐（URL 路径）
GET    /api/v1/users
GET    /api/v2/users

// ❌ 不推荐（请求头）
GET    /users
Accept: application/vnd.myapi.v1+json
```

**示例：**

```javascript
// v1 API（保持稳定）
GET    /api/v1/hotspots          # 返回基本字段
POST   /api/v1/hotspots

// v2 API（新增功能）
GET    /api/v2/hotspots          # 返回更多字段
GET    /api/v2/hotspots/trending  # 新功能
POST   /api/v2/hotspots/bulk       # 新功能
```

---

## 三、HTTP 方法使用规范

### 标准方法

| 方法 | 安全 | 幂等 | 描述 |
|------|------|------|------|
| GET | ✅ | ✅ | 获取资源 |
| POST | ❌ | ❌ | 创建资源 |
| PUT | ❌ | ✅ | 更新资源（全量） |
| PATCH | ❌ | ❌ | 更新资源（部分） |
| DELETE | ❌ | ✅ | 删除资源 |

### 使用场景

```javascript
// GET - 获取资源
GET    /users              # 获取用户列表
GET    /users/{id}         # 获取单个用户

// POST - 创建资源
POST   /users              # 创建用户
{
  "name": "张三",
  "email": "zhangsan@example.com"
}

// PUT - 更新资源（全量）
PUT    /users/{id}
{
  "name": "李四",
  "email": "lisi@example.com",
  "status": "active"
}
// 必须提供所有字段，否则设为 null

// PATCH - 更新资源（部分）
PATCH  /users/{id}
{
  "name": "王五"
}
// 只更新提供的字段

// DELETE - 删除资源
DELETE /users/{id}
```

### 不常见但有用的方法

```javascript
// HEAD - 获取响应头（不返回 body）
HEAD   /users/{id}
// 用于检查资源是否存在

// OPTIONS - 获取支持的 HTTP 方法
OPTIONS /users
// 返回：Allow: GET, POST, PUT, DELETE
```

---

## 四、HTTP 状态码规范

### 状态码分类

| 类别 | 状态码 | 描述 |
|------|--------|------|
| 2xx | 200-299 | 成功 |
| 3xx | 300-399 | 重定向 |
| 4xx | 400-499 | 客户端错误 |
| 5xx | 500-599 | 服务器错误 |

### 常用状态码

```javascript
// 2xx - 成功

200 OK
// 请求成功
GET    /users/{id} → 200 OK
{
  "id": 1,
  "name": "张三"
}

201 Created
// 资源创建成功
POST   /users → 201 Created
{
  "id": 1,
  "name": "张三"
}
// Location: /api/v1/users/1

204 No Content
// 请求成功，无返回内容
DELETE /users/{id} → 204 No Content
PUT    /users/{id}/status → 204 No Content

// 3xx - 重定向

301 Moved Permanently
// 永久重定向
GET    /old-url → 301 Moved Permanently
// Location: /new-url

302 Found
// 临时重定向
GET    /redirect → 302 Found
// Location: /target

304 Not Modified
// 资源未修改（缓存）
GET    /users/{id}
// If-None-Match: "abc123"
→ 304 Not Modified

// 4xx - 客户端错误

400 Bad Request
// 请求参数错误
POST   /users
{
  "email": "invalid-email"  // 邮箱格式错误
}
→ 400 Bad Request

401 Unauthorized
// 未认证
GET    /users/{id}
→ 401 Unauthorized
{
  "error": "未认证，请先登录"
}

403 Forbidden
// 已认证但无权限
GET    /admin/users
→ 403 Forbidden
{
  "error": "无权访问管理员资源"
}

404 Not Found
// 资源不存在
GET    /users/999
→ 404 Not Found
{
  "error": "用户不存在"
}

405 Method Not Allowed
// HTTP 方法不支持
DELETE /users
→ 405 Method Not Allowed
{
  "error": "不允许删除用户列表"
}

409 Conflict
// 请求冲突
POST   /users
{
  "email": "zhangsan@example.com"  // 邮箱已存在
}
→ 409 Conflict
{
  "error": "邮箱已被使用"
}

422 Unprocessable Entity
// 请求格式正确但语义错误
POST   /users
{
  "name": ""  // 名字不能为空
}
→ 422 Unprocessable Entity
{
  "error": "名字不能为空"
}

429 Too Many Requests
// 请求过多（速率限制）
GET    /users
→ 429 Too Many Requests
{
  "error": "请求过于频繁，请稍后再试",
  "retryAfter": 60
}

// 5xx - 服务器错误

500 Internal Server Error
// 服务器内部错误
GET    /users
→ 500 Internal Server Error
{
  "error": "服务器内部错误"
}

502 Bad Gateway
// 网关错误
→ 502 Bad Gateway

503 Service Unavailable
// 服务不可用
→ 503 Service Unavailable
{
  "error": "服务暂时不可用",
  "retryAfter": 300
}
```

---

## 五、请求和响应格式

### 1. 请求格式

**Content-Type：**

```javascript
// JSON
POST   /api/v1/users
Content-Type: application/json
{
  "name": "张三",
  "email": "zhangsan@example.com"
}

// 表单数据
POST   /api/v1/users
Content-Type: application/x-www-form-urlencoded
name=张三&email=zhangsan@example.com

// 文件上传
POST   /api/v1/users/avatar
Content-Type: multipart/form-data
{
  "file": <binary data>
}

// GraphQL
POST   /graphql
Content-Type: application/json
{
  "query": "query { users { id name } }"
}
```

**Accept：**

```javascript
// 指定响应格式
GET    /api/v1/users
Accept: application/json

// 指定版本
GET    /api/v1/users
Accept: application/vnd.myapi.v1+json

// 指定语言
GET    /api/v1/users
Accept-Language: zh-CN
```

### 2. 响应格式

**成功响应：**

```javascript
// 单个资源
GET    /api/v1/users/1
→ 200 OK
{
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}

// 资源列表
GET    /api/v1/users?page=1&limit=20
→ 200 OK
{
  "data": [
    {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    {
      "id": 2,
      "name": "李四",
      "email": "lisi@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// 创建成功
POST   /api/v1/users
{
  "name": "王五",
  "email": "wangwu@example.com"
}
→ 201 Created
{
  "data": {
    "id": 3,
    "name": "王五",
    "email": "wangwu@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
// Location: /api/v1/users/3
```

**错误响应：**

```javascript
// 标准错误格式
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      },
      {
        "field": "name",
        "message": "名字不能为空"
      }
    ],
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/v1/users",
    "requestId": "req_123456"
  }
}

// 简化错误格式
{
  "error": "用户不存在",
  "code": "USER_NOT_FOUND",
  "status": 404
}
```

---

## 六、热点地图 API 设计示例

### API 结构

```javascript
// 基础路径
/api/v1/hotspots

// 端点设计

// 1. 获取热点列表（支持筛选、排序、分页）
GET    /api/v1/hotspots
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - platform: string[] (可选: xiaohongshu, weibo, douyin, bilibili)
  - type: string[] (可选: food, travel, activity, acg, social)
  - city: string
  - sort: string (default: -heat)  // -heat 降序, heat 升序
  - search: string  // 搜索关键词

Response:
{
  "data": [
    {
      "id": "hotspot_001",
      "title": "故宫博物院",
      "platform": "xiaohongshu",
      "type": "travel",
      "city": "北京",
      "lat": 39.9163,
      "lng": 116.3972,
      "heat": 95.6,
      "posts": 12034,
      "url": "https://xiaohongshu.com/...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "stats": {
    "totalHotspots": 100,
    "byPlatform": {
      "xiaohongshu": 35,
      "weibo": 30,
      "douyin": 20,
      "bilibili": 15
    },
    "byType": {
      "food": 20,
      "travel": 35,
      "activity": 10,
      "acg": 20,
      "social": 15
    }
  }
}

// 2. 获取单个热点详情
GET    /api/v1/hotspots/{id}
Response:
{
  "data": {
    "id": "hotspot_001",
    "title": "故宫博物院",
    "description": "中国明清两代的皇家宫殿",
    "platform": "xiaohongshu",
    "type": "travel",
    "city": "北京",
    "address": "北京市东城区景山前街4号",
    "lat": 39.9163,
    "lng": 116.3972,
    "heat": 95.6,
    "posts": 12034,
    "likes": 45678,
    "comments": 8921,
    "tags": ["故宫", "历史", "建筑", "文化"],
    "images": [
      {
        "url": "https://...",
        "width": 800,
        "height": 600
      }
    ],
    "url": "https://xiaohongshu.com/...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}

// 3. 创建热点
POST   /api/v1/hotspots
Body:
{
  "title": "新热点",
  "description": "描述",
  "platform": "xiaohongshu",
  "type": "travel",
  "city": "北京",
  "address": "地址",
  "lat": 39.9163,
  "lng": 116.3972,
  "tags": ["标签1", "标签2"]
}
Response: 201 Created
{
  "data": {
    "id": "hotspot_new",
    "title": "新热点",
    // ...
  }
}

// 4. 更新热点
PATCH  /api/v1/hotspots/{id}
Body:
{
  "title": "更新的标题",
  "description": "更新的描述"
}
Response: 200 OK
{
  "data": {
    "id": "hotspot_001",
    "title": "更新的标题",
    // ...
  }
}

// 5. 删除热点
DELETE /api/v1/hotspots/{id}
Response: 204 No Content

// 6. 批量获取热点
POST   /api/v1/hotspots/batch
Body:
{
  "ids": ["hotspot_001", "hotspot_002", "hotspot_003"]
}
Response: 200 OK
{
  "data": [
    {
      "id": "hotspot_001",
      "title": "故宫博物院",
      // ...
    },
    {
      "id": "hotspot_002",
      "title": "天坛公园",
      // ...
    }
  ]
}

// 7. 获取统计信息
GET    /api/v1/hotspots/stats
Query Parameters:
  - platform: string (可选)
  - type: string (可选)
  - city: string (可选)

Response: 200 OK
{
  "data": {
    "totalHotspots": 100,
    "totalPosts": 123456,
    "byPlatform": {
      "xiaohongshu": 35,
      "weibo": 30,
      "douyin": 20,
      "bilibili": 15
    },
    "byType": {
      "food": 20,
      "travel": 35,
      "activity": 10,
      "acg": 20,
      "social": 15
    },
    "byCity": {
      "北京": 30,
      "上海": 25,
      "广州": 20,
      "成都": 15,
      "杭州": 10
    },
    "avgHeat": 85.6
  }
}

// 8. 刷新数据（触发抓取）
POST   /api/v1/hotspots/refresh
Body:
{
  "platforms": ["xiaohongshu", "weibo"],  // 可选，默认所有平台
  "force": false  // 可选，强制刷新
}
Response: 202 Accepted
{
  "data": {
    "taskId": "task_123456",
    "status": "pending",
    "message": "数据刷新任务已启动"
  }
}

// 9. 获取刷新任务状态
GET    /api/v1/hotspots/refresh/tasks/{taskId}
Response: 200 OK
{
  "data": {
    "taskId": "task_123456",
    "status": "completed",
    "progress": 100,
    "message": "数据刷新完成",
    "result": {
      "newHotspots": 10,
      "updatedHotspots": 25,
      "failedHotspots": 2
    },
    "startedAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:05:00Z"
  }
}
```

---

## 七、API 安全

### 1. 认证（Authentication）

**JWT（JSON Web Token）：**

```javascript
// 登录获取 token
POST   /api/v1/auth/login
{
  "email": "zhangsan@example.com",
  "password": "password123"
}
Response: 200 OK
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}

// 使用 token 访问受保护资源
GET    /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**API Key：**

```javascript
// 请求头
GET    /api/v1/hotspots
X-API-Key: your-api-key-here

// 查询参数
GET    /api/v1/hotspots?api_key=your-api-key-here
```

### 2. 授权（Authorization）

**基于角色的访问控制（RBAC）：**

```javascript
// 管理员可以创建热点
POST   /api/v1/hotspots
Authorization: Bearer {token}
// role: admin

// 普通用户只能读取
GET    /api/v1/hotspots
Authorization: Bearer {token}
// role: user

// 无权限
DELETE /api/v1/hotspots/1
Authorization: Bearer {token}
// role: user
→ 403 Forbidden
{
  "error": "无权删除热点"
}
```

### 3. 速率限制（Rate Limiting）

```javascript
// 设置速率限制
// 100 次请求 / 15 分钟

GET    /api/v1/hotspots
→ 200 OK

// ...

GET    /api/v1/hotspots
→ 429 Too Many Requests
{
  "error": "请求过于频繁",
  "retryAfter": 300,
  "limit": 100,
  "remaining": 0,
  "reset": 1640995200
}
```

### 4. CORS（跨域资源共享）

```javascript
// 服务端设置 CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://hotspot-map.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

---

## 八、API 文档

### 使用 Swagger/OpenAPI

**swagger.json：**

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Hotspot Map API",
    "version": "1.0.0",
    "description": "热点地图 API 文档"
  },
  "servers": [
    {
      "url": "https://api.hotspot-map.com/v1",
      "description": "生产环境"
    },
    {
      "url": "http://localhost:3000/v1",
      "description": "开发环境"
    }
  ],
  "paths": {
    "/hotspots": {
      "get": {
        "summary": "获取热点列表",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 20,
              "maximum": 100
            }
          },
          {
            "name": "platform",
            "in": "query",
            "schema": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["xiaohongshu", "weibo", "douyin", "bilibili"]
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "成功",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HotspotListResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "创建热点",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateHotspotRequest"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "创建成功",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Hotspot"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 九、最佳实践总结

### ✅ DO

1. **使用名词复数** - `/users` 而不是 `/user`
2. **使用标准 HTTP 方法** - GET、POST、PUT、PATCH、DELETE
3. **使用标准状态码** - 200、201、204、400、401、403、404
4. **版本控制** - `/api/v1/users`
5. **使用查询参数** - 过滤、排序、分页、搜索
6. **统一响应格式** - `{ data: {}, pagination: {} }`
7. **错误处理** - 标准错误格式 `{ error: { code, message } }`
8. **认证授权** - JWT、API Key、RBAC
9. **速率限制** - 防止滥用
10. **完整文档** - Swagger/OpenAPI

### ❌ DON'T

1. **不要使用动词** - `/getUsers` 而不是 `/users`
2. **不要嵌套过深** - 不要超过 3 层
3. **不要返回太多数据** - 使用字段选择
4. **不要忽略状态码** - 正确使用 200、201、204 等
5. **不要硬编码 URL** - 使用环境变量
6. **不要忽略安全** - 认证、授权、CORS、速率限制
7. **不要缺乏文档** - API 需要完整的文档

---

## 十、Express 实现示例

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 中间件
app.use(helmet());  // 安全头
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 100,  // 100 次请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: 300
  }
});
app.use('/api/v1/', limiter);

// 请求日志
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// 路由
app.get('/api/v1/hotspots', async (req, res) => {
  try {
    const { page = 1, limit = 20, platform, type, sort } = req.query;

    // 查询数据
    const hotspots = await db.getHotspots({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      platform,
      type,
      sort
    });

    const total = await db.countHotspots({ platform, type });

    res.json({
      data: hotspots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

app.post('/api/v1/hotspots', async (req, res) => {
  try {
    const hotspot = await db.createHotspot(req.body);

    res.status(201).json({
      data: hotspot
    });
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details
        }
      });
    } else {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        }
      });
    }
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误',
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.id
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 十一、学习总结

**核心原则：**
1. **资源导向** - 一切皆是资源
2. **统一接口** - 标准 HTTP 方法和状态码
3. **无状态** - 每个请求包含所有信息
4. **分层系统** - 客户端不需要知道架构细节

**URL 设计：**
- 使用名词复数
- 不超过 3 层嵌套
- 使用查询参数进行过滤、排序、分页
- 版本控制：`/api/v1/users`

**HTTP 方法：**
- GET - 获取资源
- POST - 创建资源
- PUT - 更新资源（全量）
- PATCH - 更新资源（部分）
- DELETE - 删除资源

**HTTP 状态码：**
- 2xx - 成功（200、201、204）
- 4xx - 客户端错误（400、401、403、404、422、429）
- 5xx - 服务器错误（500、502、503）

**响应格式：**
- 成功：`{ data: {}, pagination: {} }`
- 错误：`{ error: { code, message, details } }`

**安全：**
- 认证：JWT、API Key
- 授权：RBAC
- 速率限制
- CORS

**文档：**
- 使用 Swagger/OpenAPI
- 提供完整示例
- 包含错误场景

---

**依依2号 - 2026-03-23**
**学习主题：REST API 设计最佳实践**
