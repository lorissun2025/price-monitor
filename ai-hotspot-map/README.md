# AI Native 热点地图

一个 AI 驱动的智能热点发现平台，通过 AI 理解用户需求，主动发现、推荐、分析社交媒体热点。

## ✨ 特性

### MVP 阶段（v0.1）

- 🤖 **AI 主动推荐** - AI 分析用户行为，主动推送感兴趣的热点
- 🔮 **热点趋势预测** - AI 分析热点数据，预测哪些内容会爆发
- 💬 **智能内容摘要** - AI 自动总结热点内容，提取核心卖点
- 🔍 **自然语言搜索** - 用户用自然语言描述需求，AI 理解意图
- ❓ **智能问答** - 用户针对具体热点提问，AI 基于内容回答

### 增强阶段（v0.2）

- 📊 **专题推荐** - AI 发现热点关联，生成主题化推荐
- 💡 **智能对比** - AI 帮用户对比多个热点
- 🔍 **热点趋势洞察** - AI 分析整体趋势，提供洞察报告
- 👤 **用户画像** - AI 分析用户行为，生成个性化画像

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 🛠️ 技术栈

- **前端：** React 18 + TypeScript + Vite 5
- **样式：** Tailwind CSS 3
- **路由：** React Router 6
- **HTTP 客户端：** Axios
- **AI 模型：** OpenAI GPT-4
- **向量数据库：** Chroma

## 📁 项目结构

```
ai-hotspot-map/
├── src/
│   ├── components/         # React 组件
│   │   ├── layout/        # 布局组件
│   │   ├── map/           # 地图组件
│   │   ├── ai/            # AI 组件
│   │   └── common/        # 通用组件
│   ├── hooks/             # 自定义 Hooks
│   ├── services/          # API 服务
│   ├── stores/            # 状态管理
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript 类型
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/                  # 文档
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 📊 开发进度

### MVP 阶段（v0.1）- 3 周

- [ ] 前端 React + TypeScript + Vite 搭建
- [ ] 后端 Node.js + Express + TypeScript 搭建
- [ ] PostgreSQL 数据库设计和迁移
- [ ] Redis 缓存集成
- [ ] Chroma 向量数据库集成
- [ ] OpenAI GPT-4 API 集成
- [ ] 内容摘要功能
- [ ] 智能问答功能
- [ ] 自然语言搜索
- [ ] 向量嵌入生成和存储
- [ ] 规则引擎推荐算法
- [ ] 前端 AI 组件开发
- [ ] 前端地图组件开发
- [ ] 前后端联调
- [ ] 测试和 Bug 修复

### 增强阶段（v0.2）- 5 周

- [ ] 协同过滤算法
- [ ] 内容过滤算法
- [ ] 混合推荐算法
- [ ] 用户画像模型
- [ ] 趋势预测模型（XGBoost）
- [ ] 情感分析模型（BERT）
- [ ] 专题推荐功能
- [ ] 智能对比功能
- [ ] 性能优化
- [ ] 成本优化
- [ ] 生产环境部署

## 📝 文档

- [PRD - 产品需求文档](./docs/PRD-AI-NATIVE.md)
- [Tech Spec - 技术方案文档](./docs/Tech-Spec-AI-NATIVE.md)

## 🤝 贡献

欢迎贡献代码和提出建议！

## 📄 许可证

MIT

## 👤 作者

依依2号 - 私人助理
