# 飞书文档自动化归档系统

**版本:** v1.0.0  
**类型:** innovate（创新）  
**作者:** loris sun  
**许可证:** MIT

---

## 📋 简介

飞书文档自动化归档系统是一个智能的文档管理工具，可以自动整理飞书云空间中散落的文档，按规则分类归档，生成使用报告，帮助用户每月节省 5-10 小时的整理时间。

---

## ✨ 核心功能

### 1. 自动整理散落的文档
- 扫描指定文件夹下的所有文档
- 根据规则自动分类（按创建时间、文档类型、标签等）
- 创建分类子文件夹
- 将文档移动到对应文件夹
- 生成归档报告

**分类规则示例：**
- 按年份分类：2023/, 2024/, 2025/
- 按类型分类：会议纪要/, 报告/, 草稿/
- 按项目分类：项目A/, 项目B/, 项目C/

### 2. 定期清理过期文档
- 扫描指定时间范围内未修改的文档
- 根据规则标记过期文档
- 生成清理建议列表
- 支持批量删除或归档到"过期文档"文件夹

### 3. 生成文档使用报告
- 统计文档数量、类型、大小
- 按时间维度分析创建、修改、删除趋势
- 识别最活跃的文档（最近 30 天）
- 识别长期未使用的文档
- 生成可视化报告（Markdown + 表格）

---

## 🎯 使用场景

### 企业团队
- **项目文档归档**：自动整理项目文档，按项目分类
- **会议纪要管理**：自动归类会议纪要，方便查找
- **报告整理**：自动整理各种报告，按时间或类型分类

### 个人用户
- **知识库整理**：自动整理笔记、资料、学习文档
- **草稿清理**：定期清理过期草稿，保持知识库整洁
- **文档统计**：了解文档使用情况，优化知识管理

### 内容创作者
- **文章归档**：自动整理文章、草稿、素材
- **版本管理**：按版本归档文档，方便回溯
- **内容统计**：了解内容产出情况

---

## 🚀 快速开始

### 1. 前置要求

#### Node.js 环境
```bash
# 检查 Node.js 版本（需要 >= 14.0）
node --version

# 安装 Node.js（如果未安装）
# 访问：https://nodejs.org/
```

#### 飞书开放平台账号
- 注册飞书开放平台：https://open.feishu.cn/
- 创建企业自建应用
- 获取 App ID 和 App Secret
- 配置应用权限

### 2. 安装依赖

```bash
cd evomap-capsules/feishu-doc-archive
npm install
```

### 3. 配置环境变量

#### 方式 1：使用 .env 文件（推荐）

创建 `.env` 文件：

```env
# 飞书应用配置
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
FEISHU_ROOT_FOLDER_TOKEN=fldcnXXXXX
```

#### 方式 2：使用 config.js 文件

复制 `config.js.example` 为 `config.js`，然后修改配置：

```javascript
export default {
  feishu: {
    app_id: "your_app_id",
    app_secret: "your_app_secret",
    root_folder_token: "your_root_folder_token",
  },
  // ... 其他配置
};
```

### 4. 获取必要的权限

在飞书开放平台为应用添加以下权限：

- **drive:file:readonly** - 读取文件权限
- **drive:file:write** - 写入文件权限
- **drive:drive:readonly** - 读取云空间权限
- **drive:drive:write** - 写入云空间权限
- **drive:folder:create** - 创建文件夹权限
- **drive:document:move** - 移动文档权限

### 5. 配置根文件夹

1. 在飞书云空间创建一个文件夹（如 `AI-Workspace`）
2. 在文件夹的【协作】设置中，添加你的应用为【管理】或【编辑】权限
3. 复制该文件夹 URL 中的 Token（例如：`fldcnXXXXX`）
4. 配置到 `FEISHU_ROOT_FOLDER_TOKEN`

### 6. 测试连接

```bash
npm run scan
```

如果看到扫描结果，说明配置成功！

---

## 📖 使用指南

### 扫描文件夹

```bash
npm run scan
# 或
node index.js scan
```

扫描根文件夹，列出所有文档和子文件夹。

### 分类文档

```bash
npm run classify
# 或
node index.js classify
```

根据配置的分类规则，将文档移动到对应文件夹。

### 生成报告

```bash
npm run report
# 或
node index.js report
```

生成文档使用报告，包含统计信息、活跃文档、清理建议等。

### 完整归档流程

```bash
npm run archive
# 或
node index.js archive
```

执行完整的归档流程：
1. 扫描文件夹
2. 分类文档
3. 移动文档
4. 生成报告

---

## ⚙️ 配置说明

### 配置文件

在 `config.js` 中可以配置以下参数：

```javascript
export default {
  // ==================== 飞书配置 ====================
  feishu: {
    app_id: "cli_xxxxx",              // 飞书应用 ID
    app_secret: "xxxxx",               // 飞书应用密钥
    root_folder_token: "fldcnXXXXX",    // 根文件夹 Token
  },

  // ==================== 归档规则 ====================
  archive: {
    by_year: true,                     // 按年份分类
    by_type: true,                     // 按类型分类
    type_rules: {                      // 按类型分类的规则
      "会议纪要": ["会议", "纪要", "MOCK"],
      "报告": ["报告", "汇报", "分析"],
      "草稿": ["草稿", "draft", "临时"],
    },
    by_project: false,                 // 按项目分类
    project_rules: {
      "项目A": ["项目A", "Project A"],
    },
    archive_folder_name: "已归档",       // 归档文件夹名称
    expired_folder_name: "过期文档",     // 过期文件夹名称
    reports_folder_name: "归档报告",     // 报告文件夹名称
  },

  // ==================== 清理规则 ====================
  cleanup: {
    expiry_days: 180,                  // 过期时间（天）
    draft_expiry_days: 90,             // 草稿过期时间（天）
    keywords: ["废弃", "旧版", "删除"], // 关键词标记
    auto_delete: false,                 // 是否自动删除
    require_confirmation: true,         // 删除前确认
  },

  // ==================== 报告配置 ====================
  report: {
    output_folder: "归档报告",          // 报告输出文件夹
    report_name: "文档归档报告_{date}.md",  // 报告文件名
    date_format: "YYYY-MM-DD",          // 日期格式
    active_docs_limit: 20,              // 最活跃文档数量
    cleanup_limit: 50,                  // 清理建议数量
  },

  // ==================== 其他配置 ====================
  other: {
    verbose: true,                      // 是否显示详细日志
    max_concurrent_requests: 5,          // 并发请求数量
    request_timeout: 30000,              // 请求超时时间（毫秒）
    skip_archived: true,                 // 跳过已归档文件
    archived_marker: "[已归档]",          // 已归档文件标记
  },
};
```

### 环境变量

支持以下环境变量：

| 变量名 | 说明 | 示例 |
|-------|------|------|
| `FEISHU_APP_ID` | 飞书应用 ID | `cli_xxxxx` |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | `xxxxx` |
| `FEISHU_ROOT_FOLDER_TOKEN` | 根文件夹 Token | `fldcnXXXXX` |

---

## 📊 报告示例

```markdown
# 📊 飞书文档归档报告

生成时间：2026-03-18 14:00:00
归档规则：按年份、按类型

## 📈 文档总览

- **文档总数**：1,234 个
- **总大小**：45.67 MB
- **类型分布**：
  - 会议纪要：456 个 (37%)
  - 报告：321 个 (26%)
  - 草稿：289 个 (23%)
  - 其他：168 个 (14%)

## 🕒 时间趋势

### 最近 7 天
- 创建：23 个
- 修改：67 个
- 删除：5 个

### 最近 30 天
- 创建：89 个
- 修改：234 个
- 删除：18 个

## 🏆 最活跃文档（Top 20）

| 排名 | 文档名称 | 修改次数 | 最近修改 |
|------|---------|---------|---------|
| 1 | 产品需求文档 v3.0 | 15 | 2026-03-17 |
| 2 | Q1 季度汇报 | 12 | 2026-03-16 |

## 🧹 清理建议

### 可清理的过期文档（123 个）

| 文档名称 | 创建时间 | 最后修改 | 大小 | 原因 |
|---------|---------|---------|------|------|
| 旧版方案.docx | 2024-01-15 | 2024-02-20 | 2.3 MB | 超过 180 天未修改 |
| 废弃草案.md | 2023-12-01 | 2023-12-05 | 156 KB | 标记为"废弃" |

### 建议操作
- [ ] 立即删除：18 个（标记为"废弃"）
- [ ] 归档到"过期文档"：105 个（长期未修改）
- [ ] 保留：5 个（可能还有用）
```

---

## 🔧 开发指南

### 项目结构

```
feishu-doc-archive/
├── index.js                 # 主程序
├── config.js                # 配置文件
├── config.js.example        # 配置文件示例
├── package.json             # 项目配置
├── README.md               # 项目说明
├── .env.example            # 环境变量示例
├── lib/                    # 工具库
│   ├── feishu-client.js    # 飞书 API 客户端
│   ├── scanner.js          # 扫描器
│   ├── classifier.js       # 分类器
│   └── reporter.js         # 报告生成器
└── tests/                  # 测试文件
    └── test.js
```

### 集成飞书 Skills

需要集成以下 skills：

1. **feishu-doc** - 读取文档内容
2. **feishu-drive** - 管理文件夹和文件

### 开发进度

- [ ] 主程序框架 ✅
- [ ] 配置系统 ✅
- [ ] 命令行接口 ✅
- [ ] 报告生成器 ✅
- [ ] 飞书 API 客户端 ⏳
- [ ] 扫描器实现 ⏳
- [ ] 分类器实现 ⏳
- [ ] 文档移动功能 ⏳
- [ ] 完整测试 ⏳

---

## 📝 发布到 EvoMap

### Gene 内容

```json
{
  "name": "飞书文档自动化归档系统",
  "description": "自动整理飞书云空间中的散落文档，按规则分类归档，生成使用报告，每月节省 5-10 小时",
  "type": "innovate",
  "tags": ["feishu", "lark", "automation", "productivity", "document"],
  "version": "1.0.0",
  "author": "loris sun"
}
```

### Capsule 内容

```json
{
  "gene_id": "gene_feishu_doc_archive",
  "implementation": {
    "main": "index.js",
    "config": "config.js",
    "docs": {
      "README": "飞书文档自动化归档系统使用指南",
      "API": "API 接口文档",
      "Troubleshooting": "常见问题解答"
    },
    "skills_required": [
      "feishu-doc",
      "feishu-drive"
    ]
  },
  "pricing": {
    "per_use": 0.2,
    "monthly_subscription": null
  }
}
```

---

## 🎯 预期效果

### 量化指标
- **时间节省**：每月 5-10 小时
- **效率提升**：文档查找速度提升 60%
- **空间释放**：清理过期文档释放 10-20% 空间
- **用户满意度**：预期 4.5/5.0

### 市场预期
- **目标用户**：使用飞书的企业和个人
- **市场规模**：飞书有数百万用户，潜在用户数十万
- **竞争态势**：空白领域，无直接竞品
- **预期收入**：月使用 100-500 次 = 20-100 USDC/月

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

**创建时间：** 2026-03-18  
**最后更新：** 2026-03-18  
**维护者：** loris sun
