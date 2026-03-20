# 待上传项目/Skill 清单

**创建时间：** 2026-03-19
**目的：** 供老板确认是否要上传到 GitHub

---

## ✅ 已上传到 GitHub

### 1. context-management-skill
- **类型：** Skill
- **仓库：** https://github.com/lorissun2025/context-management-skill
- **版本：** v1.0
- **描述：** 上下文管理 skill，防止上下文溢出，确保任务恢复
- **功能：**
  - 任务分解策略（< 10k tokens）
  - 检查点机制
  - 恢复工具脚本
  - 快速参考卡

### 2. price-monitor
- **类型：** 项目
- **仓库：** https://github.com/lorissun2025/price-monitor
- **版本：** v0.1（早期版本）
- **描述：** 多平台价格监控提醒系统
- **功能：**
  - 多平台价格获取（淘宝、京东、拼多多、亚马逊）
  - 智能提醒（固定价格、百分比变化）
  - 价格历史记录
  - 24 小时去重提醒
- **进度：** 20%（基础功能已完成）

---

## 📋 待上传 - Skills（优先级排序）

### 优先级 1 - 核心实用工具 ⭐

#### 3. a-share-pro（A 股专业监控工具）
- **类型：** Skill（Python 项目）
- **位置：** `skills/a-share-pro/`
- **描述：** 轻量级 A 股自选股管理 + 多数据源实时行情
- **技术栈：** Python 3.8+
- **核心功能：**
  - 多数据源实时行情（腾讯财经、雪球、百度、Tushare）
  - 轻量级投资组合管理
  - 纯文本存储（无需数据库）
  - 自动数据源切换
- **文档：** ✅ README.md 完整
- **隐私检查：** ✅ 通过（无敏感信息）
- **建议上传：** ✅ 是

---

#### 4. summarize（内容摘要）
- **类型：** Skill（外部 CLI 封装）
- **位置：** `skills/summarize/`
- **描述：** 使用 summarize CLI 快速摘要 URL、文件、YouTube
- **技术栈：** 外部 CLI 工具
- **核心功能：**
  - URL 网页摘要
  - PDF 文件摘要
  - 图片、音频摘要
  - YouTube 视频摘要
  - 支持多种模型（OpenAI、Anthropic、xAI、Google）
- **文档：** ✅ SKILL.md 完整
- **隐私检查：** ✅ 通过（仅文档说明，无密钥）
- **建议上传：** ✅ 是

---

### 优先级 2 - 网络搜索相关 🔍

#### 5. firecrawl-skills（网页抓取）
- **类型：** Skill（外部 CLI 封装）
- **位置：** `skills/firecrawl-skills/`
- **描述：** Firecrawl CLI - 高级网页抓取、爬虫、搜索
- **技术栈：** 外部 CLI 工具（Node.js）
- **核心功能：**
  - 单页抓取（JavaScript 渲染）
  - 整站爬取
  - 网站地图生成
  - 网络搜索
  - 结构化数据提取
- **文档：** ✅ SKILL.md 完整（200+ 行）
- **隐私检查：** ✅ 通过（需 FIRECRAWL_API_KEY，但文档仅说明）
- **建议上传：** ✅ 是

---

#### 6. openclaw-tavily-search（Tavily 搜索）
- **类型：** Skill（脚本封装）
- **位置：** `skills/openclaw-tavily-search/`
- **描述：** Tavily 搜索 API 封装，替代 Brave 搜索
- **技术栈：** Python 脚本
- **核心功能：**
  - 网页搜索
  - 多种输出格式（JSON、Markdown）
  - 短答案支持
  - 与 Brave 搜索 API 兼容
- **文档：** ✅ SKILL.md 完整
- **隐私检查：** ✅ 通过（需 TAVILY_API_KEY，但文档仅说明）
- **建议上传：** ✅ 是

---

### 优先级 3 - 其他工具 🛠️

#### 7. obsidian-cli-official（Obsidian CLI）
- **类型：** Skill（外部 CLI 封装）
- **位置：** `skills/obsidian-cli-official/`
- **描述：** Obsidian 笔记 CLI 工具封装
- **技术栈：** 外部 CLI 工具
- **核心功能：**
  - Obsidian 笔记管理
  - 文档操作（读取、写入、搜索）
  - 元数据管理
- **文档：** ⚠️ 有文档（final-decision-report.md 等）
- **隐私检查：** ✅ 需确认
- **建议上传：** ⚠️ 需确认（看起来是调研报告，不确定是否是完整 skill）

---

#### 8. evomap-fetch-capsule（EvoMap 获取）
- **类型：** Skill
- **位置：** `skills/evomap-fetch-capsule/`
- **描述：** 从 EvoMap 网络搜索已发布的 Capsules
- **技术栈：** 未确定
- **核心功能：**
  - 搜索现有 capsules
  - 查找解决方案
- **文档：** ✅ SKILL.md 存在
- **隐私检查：** ✅ 通过
- **建议上传：** ✅ 是

---

#### 9. evomap-publish-capsule（EvoMap 发布）
- **类型：** Skill
- **位置：** `skills/evomap-publish-capsule/`
- **描述：** 发布 Gene + Capsule bundles 到 EvoMap 网络
- **技术栈：** 未确定
- **核心功能：**
  - 发布 Capsule
  - 发布 Gene
  - 发布 EvolutionEvent
  - 赚取积分
- **文档：** ✅ SKILL.md 完整
- **隐私检查：** ⚠️ 需确认（可能包含 Node Secret）
- **建议上传：** ⚠️ 需隐私检查后上传

---

## 📋 待上传 - 项目

#### 10. hotspot-map（热点地图系统 v1.1）
- **类型：** 项目
- **位置：** `hotspot-map/`
- **描述：** 地理位置化的热点内容可视化平台
- **技术栈：** HTML/CSS/JavaScript + Node.js + Express
- **核心功能：**
  - 多平台数据聚合（小红书、微博、抖音、B站）
  - 地图可视化展示（Leaflet）
  - 智能搜索功能
  - 实时数据刷新
  - 影响力评分
  - 统计面板
- **版本：** v1.1
- **文档：** ✅ README.md 完整
- **隐私检查：** ✅ 通过（无敏感信息）
- **建议上传：** ✅ 是

---

#### 11. hotspot-api（热点地图后端 API）
- **类型：** 项目（？）
- **位置：** `hotspot-api/`
- **描述：** 可能是 hotspot-map 的后端部分
- **状态：** ⚠️ 没有 README.md，不确定是否独立
- **建议：** ⚠️ 需确认是否与 hotspot-map 合并

---

#### 12. hotspot-system（热点系统文档）
- **类型：** 文档目录
- **位置：** `hotspot-system/`
- **描述：** 热点地图系统的设计文档和开发日志
- **包含：**
  - API-Design.md
  - DEVLOG-2026-03-13.md
  - QUICK-START.md
  - SCRAPER-*.md
- **建议：** ⚠️ 建议整合到 hotspot-map 仓库作为 `/docs` 目录，不单独上传

---

## 📊 统计

| 类别 | 已上传 | 待上传 | 总计 |
|------|--------|--------|------|
| Skills | 2 | 7 | 9 |
| 项目 | 1 | 2 | 3 |
| **总计** | **3** | **9** | **12** |

---

## 🎯 上传建议

### 立即上传（优先级 1）⭐
1. ✅ a-share-pro（A 股监控）
2. ✅ summarize（内容摘要）

### 近期上传（优先级 2）🔍
3. ✅ firecrawl-skills（网页抓取）
4. ✅ openclaw-tavily-search（Tavily 搜索）
5. ✅ hotspot-map（热点地图系统）

### 需要先确认的 ⚠️
6. ⚠️ obsidian-cli-official（需确认是否完整 skill）
7. ⚠️ evomap-publish-capsule（需隐私检查 Node Secret）
8. ⚠️ hotspot-api（需确认是否与 hotspot-map 合并）
9. ⚠️ hotspot-system（建议整合到 hotspot-map）

### 需要隐私检查的 🚨
- evomap-publish-capsule（检查是否包含 Node Secret）

---

## ❓ 请老板确认

**问题 1：** obsidian-cli-official 是否是完整的 skill？还是只是调研文档？

**问题 2：** hotspot-api 是否是独立项目？还是 hotspot-map 的一部分？

**问题 3：** hotspot-system 是否整合到 hotspot-map 的 `/docs` 目录？

**问题 4：** evomap-publish-capsule 是否包含 Node Secret？需要清理吗？

**问题 5：** 是否全部上传？还是只上传推荐的？

---

**请回复：**
- "全部上传" - 上传所有项目/skill
- "只上传推荐的" - 只上传标记为 ✅ 的
- 或具体指定要上传哪些

---

**准备好后，我将按照 SOP 流程：**
1. 隐私检查
2. 创建 GitHub 仓库
3. 推送到 GitHub
4. 记录到 MEMORY.md
