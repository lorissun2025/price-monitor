# 飞书文档自动化归档系统 - 设计文档

**版本:** v1.0
**类型:** innovate（创新）
**创建时间:** 2026-03-18
**目标市场:** 使用飞书的企业和个人用户

---

## 📋 需求分析

### 痛点
1. **文档散落**：飞书云空间中散落大量未分类的文档
2. **查找困难**：缺少分类归档，查找特定文档耗时
3. **重复工作**：定期手动整理文档，耗时 5-10 小时/月
4. **缺乏统计**：不知道文档使用情况，无法清理过期文档

### 目标用户
- **企业团队**：项目文档、会议纪要、报告归档
- **个人用户**：笔记、资料、个人知识库整理
- **内容创作者**：文章、草稿、素材管理

### 核心价值
- **节省时间**：自动归档，每月节省 5-10 小时
- **提高效率**：快速定位所需文档
- **保持整洁**：定期清理过期文档
- **数据洞察**：了解文档使用情况

---

## 🎯 功能设计

### 核心功能

#### 1. 自动整理散落的文档
```
功能：
- 扫描指定文件夹下的所有文档
- 根据规则自动分类（按创建时间、文档类型、标签等）
- 创建分类子文件夹
- 将文档移动到对应文件夹
- 生成归档报告

规则示例：
- 按年份分类：2023/, 2024/, 2025/
- 按类型分类：会议纪要/, 报告/, 草稿/
- 按项目分类：项目A/, 项目B/, 项目C/
```

#### 2. 定期清理过期文档
```
功能：
- 扫描指定时间范围内未修改的文档
- 根据规则标记过期文档
- 生成清理建议列表
- 支持批量删除或归档到"过期文档"文件夹

规则示例：
- 超过 180 天未修改
- 文件名包含"废弃"、"旧版"等关键词
- 标记为"草稿"且超过 90 天未修改
```

#### 3. 生成文档使用报告
```
功能：
- 统计文档数量、类型、大小
- 按时间维度分析创建、修改、删除趋势
- 识别最活跃的文档（最近 30 天）
- 识别长期未使用的文档
- 生成可视化报告（Markdown + 表格）

报告内容：
- 文档总览：总数、总大小、类型分布
- 时间趋势：最近 7 天/30 天/90 天的创建、修改统计
- 活跃文档：Top 20 最近活跃文档
- 清理建议：可清理的过期文档列表
```

#### 4. 智能分类建议
```
功能：
- 基于文档标题、内容、标签自动推荐分类
- 支持自定义分类规则
- 学习用户行为，优化分类建议
- 生成分类建议报告

分类维度：
- 按内容主题：产品、技术、市场、运营
- 按文档类型：会议纪要、报告、设计稿、代码
- 按项目：项目A、项目B、项目C
```

### 高级功能（v2.0）
- 文档自动标签提取
- 文档内容相似度分析
- 文档版本管理
- 文档协作分析

---

## 🔧 技术方案

### 技术栈
- **语言**: JavaScript (Node.js)
- **飞书 API**: Drive API (文件管理）、Doc API (文档内容）
- **依赖**: feishu-doc, feishu-drive skills
- **输出**: Markdown 报告

### 架构设计

```
┌─────────────────────────────────────┐
│     飞书文档自动化归档系统          │
└─────────────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼───┐     ┌────▼─────┐
│ 配置   │     │  核心   │
│ 模块   │────▶│  引擎   │
└───────┘     └────┬─────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌───▼───┐ ┌────▼────┐
   │ 扫描器  │ │ 分类器 │ │ 报告器  │
   └────┬────┘ └───┬───┘ └────┬────┘
        │          │          │
   ┌────▼────┐ ┌──▼───┐ ┌───▼────┐
   │ Drive   │ │  Doc  │ │ Markdown│
   │   API   │ │  API  │ │  输出  │
   └─────────┘ └──────┘ └────────┘
```

### 模块设计

#### 1. 配置模块 (Config)
```javascript
{
  // 飞书配置
  app_id: "cli_xxxxx",
  app_secret: "xxxxx",

  // 归档配置
  root_folder_token: "fldcnXXXXX",
  archive_rules: {
    // 按年份分类
    by_year: true,

    // 按类型分类
    by_type: {
      "会议纪要": ["会议", "纪要", "MOCK"],
      "报告": ["报告", "汇报", "分析"],
      "草稿": ["草稿", "draft", "临时"],
    },

    // 按项目分类
    by_project: {
      "项目A": ["项目A", "Project A"],
      "项目B": ["项目B", "Project B"],
    }
  },

  // 清理配置
  cleanup_rules: {
    // 过期时间（天）
    expiry_days: 180,
    // 草稿过期时间（天）
    draft_expiry_days: 90,
    // 关键词标记
    keywords: ["废弃", "旧版", "删除", "TODO"],
  },

  // 报告配置
  report_config: {
    output_folder: "报告",
    report_name: "文档归档报告_{date}.md",
  }
}
```

#### 2. 核心引擎 (Core)
```javascript
class ArchiveEngine {
  // 扫描文件夹
  async scanFolder(folderToken) {
    // 使用 feishu-drive 列出所有文件
    const files = await feishu_drive.listFiles(folderToken);
    return files;
  }

  // 分类文档
  async classifyDocument(file) {
    // 分析文件名、标题、内容
    const classification = this.analyzeContent(file);
    return classification;
  }

  // 移动文档
  async moveDocument(fileToken, targetFolderToken) {
    // 使用 feishu-drive 移动文件
    await feishu_drive.moveFile(fileToken, targetFolderToken);
  }

  // 生成报告
  async generateReport(stats) {
    // 生成 Markdown 报告
    const report = this.createMarkdownReport(stats);
    return report;
  }
}
```

#### 3. 扫描器 (Scanner)
```javascript
class Scanner {
  async scan(rootFolder) {
    const files = [];
    const folders = await this.listFolders(rootFolder);

    for (const folder of folders) {
      const folderFiles = await this.listFiles(folder.token);
      files.push(...folderFiles.map(f => ({
        ...f,
        folder_path: folder.path,
      })));
    }

    return files;
  }

  async listFolders(folderToken) {
    // 递归列出所有子文件夹
  }

  async listFiles(folderToken) {
    // 列出文件夹下的所有文件
  }
}
```

#### 4. 分类器 (Classifier)
```javascript
class Classifier {
  classify(file, rules) {
    const result = [];

    // 按年份分类
    if (rules.by_year) {
      const year = new Date(file.created_at).getFullYear();
      result.push({ type: 'year', value: year, path: `${year}/` });
    }

    // 按类型分类
    if (rules.by_type) {
      for (const [type, keywords] of Object.entries(rules.by_type)) {
        if (this.matchKeywords(file, keywords)) {
          result.push({ type: 'type', value: type, path: `${type}/` });
          break;
        }
      }
    }

    // 按项目分类
    if (rules.by_project) {
      for (const [project, keywords] of Object.entries(rules.by_project)) {
        if (this.matchKeywords(file, keywords)) {
          result.push({ type: 'project', value: project, path: `${project}/` });
          break;
        }
      }
    }

    return result;
  }

  matchKeywords(file, keywords) {
    const text = `${file.name} ${file.title || ''}`;
    return keywords.some(keyword => text.includes(keyword));
  }
}
```

#### 5. 报告器 (Reporter)
```javascript
class Reporter {
  generate(stats, rules) {
    const report = `# 📊 飞书文档归档报告

生成时间：${new Date().toLocaleString('zh-CN')}
归档规则：${JSON.stringify(rules, null, 2)}

## 📈 文档总览

- **文档总数**：${stats.total} 个
- **总大小**：${this.formatSize(stats.totalSize)}
- **类型分布**：
${this.formatTypeDistribution(stats.byType)}

## 🕒 时间趋势

### 最近 7 天
- 创建：${stats.recent7d.created}
- 修改：${stats.recent7d.modified}
- 删除：${stats.recent7d.deleted}

### 最近 30 天
- 创建：${stats.recent30d.created}
- 修改：${stats.recent30d.modified}
- 删除：${stats.recent30d.deleted}

## 🏆 最活跃文档（Top 20）

${this.formatActiveDocs(stats.activeDocs)}

## 🧹 清理建议

${this.formatCleanupSuggestions(stats.cleanup)}
`;

    return report;
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
```

---

## 📝 使用流程

### 1. 初始化配置
```javascript
const config = {
  // 配置飞书应用
  app_id: process.env.FEISHU_APP_ID,
  app_secret: process.env.FEISHU_APP_SECRET,

  // 配置归档规则
  root_folder_token: "fldcnXXXXX",
  archive_rules: { /* ... */ },
};
```

### 2. 执行归档
```javascript
const engine = new ArchiveEngine(config);

// 扫描文件夹
const files = await engine.scanFolder(config.root_folder_token);

// 分类文档
const classified = await Promise.all(
  files.map(file => engine.classifyDocument(file))
);

// 移动文档
for (const item of classified) {
  await engine.moveDocument(
    item.file.token,
    item.target_folder_token
  );
}

// 生成报告
const report = await engine.generateReport(stats);
```

### 3. 查看报告
```javascript
// 报告保存在指定文件夹
// 报告格式：Markdown
// 包含文档统计、分类结果、清理建议等
```

---

## 🎨 报告示例

```markdown
# 📊 飞书文档归档报告

生成时间：2026-03-18 11:00:00
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
| ... | ... | ... | ... |

## 🧹 清理建议

### 可清理的过期文档（123 个）

| 文档名称 | 创建时间 | 最后修改 | 大小 | 原因 |
|---------|---------|---------|------|------|
| 旧版方案.docx | 2024-01-15 | 2024-02-20 | 2.3 MB | 超过 180 天未修改 |
| 废弃草案.md | 2023-12-01 | 2023-12-05 | 156 KB | 标记为"废弃" |
| ... | ... | ... | ... | ... |

### 建议操作
- [ ] 立即删除：18 个（标记为"废弃"）
- [ ] 归档到"过期文档"：105 个（长期未修改）
- [ ] 保留：5 个（可能还有用）
```

---

## 🚀 发布到 EvoMap

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
    "config": "config.json.example",
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

## 📊 预期效果

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

**设计完成时间：** 2026-03-18 11:35
**下一步：** 实现代码
