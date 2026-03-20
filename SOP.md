# SOP - 标准操作流程

## 🚀 项目和 Skill 发布 SOP

**创建时间：** 2026-03-19
**目的：** 确保工作成果可持久化，防止换设备丢失，保护隐私安全

---

## ✅ SOP 规则

### 1. 新 Skill 创造流程

**步骤：**
1. 设计和开发 skill
2. 创建完整文档（SKILL.md、README.md、QUICK-REF.md）
3. **⚠️ 隐私检查**（必须！）
4. 创建 GitHub 仓库
5. 推送到 GitHub
6. 记录到 MEMORY.md

---

### 2. 隐私安全检查清单 ⚠️

**上传到 GitHub 前必须检查：**

- [ ] **不包含 API keys**
  - ✅ OpenAI API key
  - ✅ Brave Search API key
  - ✅ Firebase/Tencent Cloud API keys
  - ✅ 任何平台的密钥、token、secret

- [ ] **不包含敏感配置**
  - ✅ 数据库连接字符串
  - ✅ 第三方服务凭证
  - ✅ 个人账户信息（用户名、密码）

- [ ] **不包含私密数据**
  - ✅ 老板的个人数据
  - ✅ 私人通讯录
  - ✅ 内部机密信息

- [ ] **检查文件类型**
  - ❌ `.env` 文件（使用 .gitignore）
  - ❌ `config/credentials.json`
  - ❌ `secrets/` 目录
  - ❌ `*_secret.js` 或 `*_secret.md`

---

### 3. GitHub 仓库命名规范

**格式：** `{功能描述}-{类型}`

**示例：**
- `price-monitor` (项目)
- `context-management-skill` (Skill)
- `hotspot-map-v1.0` (带版本)
- `feishu-bot-integration` (功能型)

**描述规范：**
- 简洁明了
- 使用英文
- 首字母小写
- 用连字符分隔

---

### 4. GitHub 仓库模板

每个仓库必须包含：

**必需文件：**
- ✅ `README.md` - 项目说明 + 快速开始
- ✅ `LICENSE` - 开源许可证（推荐 MIT）
- ✅ `.gitignore` - 忽略敏感文件
- ✅ `package.json` - 如果是 Node.js 项目

**Skill 特定：**
- ✅ `SKILL.md` - 完整的 skill 文档
- ✅ `QUICK-REF.md` - 快速参考卡（可选但推荐）

**项目特定：**
- ✅ `CHANGELOG.md` - 更新日志（推荐）
- ✅ `CONTRIBUTING.md` - 贡献指南（可选）

---

### 5. 隐私配置处理方式

**错误做法：**
```javascript
// ❌ 直接硬编码 API key
const apiKey = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

**正确做法：**
```javascript
// ✅ 使用环境变量
const apiKey = process.env.OPENAI_API_KEY;

// ✅ 或使用配置文件模板
const config = {
  apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE'
};
```

**创建配置模板：**
```bash
# .env.example（上传到 GitHub）
OPENAI_API_KEY=your_api_key_here
BRAVE_API_KEY=your_brave_key_here

# .env（不上传，在 .gitignore 中）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BRAVE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 6. 记录到 MEMORY.md

每次上传后，在 MEMORY.md 中记录：

```markdown
## YYYY-MM-DD 新增 Skill/项目

### [Skill/项目名称]

**类型：** Skill / 项目
**版本：** vX.X.X
**仓库地址：** https://github.com/lorissun2025/xxx
**核心功能：** [简要说明]

**完成内容：**
- [x] 功能 1
- [x] 功能 2
- [x] 隐私检查通过

**下一步：** [待开发内容]
```

---

## 🔍 现有 Skill 检查清单

需要检查的 skill 位置：
- `/Users/sunsensen/.openclaw/workspace/skills/`
- `/Users/sunsensen/.openclaw/workspace/`

### 已上传到 GitHub 的 Skill：

1. ✅ **context-management-skill** - https://github.com/lorissun2025/context-management-skill
   - [x] 隐私检查：无敏感信息
   - [x] 文档完整：SKILL.md + README.md + QUICK-REF.md

2. ✅ **price-monitor** - https://github.com/lorissun2025/price-monitor
   - [x] 隐私检查：无敏感信息
   - [x] 文档完整：README.md

### 未上传的 Skill（需要整理后上传）：

- [ ] `a-share-pro` - A 股监控工具
- [ ] `feishu-*` - 飞书相关 skills
- [ ] `evomap-*` - EvoMap 相关 skills
- [ ] 其他 workspace 中的 skill

---

## 📋 上传前检查清单

**每次上传前必须执行：**

- [ ] **隐私安全检查**
  - [ ] 搜索 `api_key`, `secret`, `password`, `token` 关键词
  - [ ] 检查 `.env` 文件是否在 .gitignore
  - [ ] 检查是否有硬编码的凭证

- [ ] **文档完整性检查**
  - [ ] README.md 是否清晰
  - [ ] 安装和快速开始是否完整
  - [ ] 是否有使用示例

- [ ] **代码质量检查**
  - [ ] 没有调试用的 console.log
  - [ ] 没有临时文件（*.tmp, *.temp）
  - [ ] .gitignore 配置正确

- [ ] **Git 提交检查**
  - [ ] commit message 清晰描述了改动
  - [ ] 分支名称合理（main/master）
  - [ ] 标签版本号（可选）

---

## 🚨 紧急处理

**如果发现已上传的仓库包含敏感信息：**

1. **立即删除敏感文件**
   ```bash
   git rm --cached sensitive-file.js
   git commit -m "Remove sensitive file"
   git push
   ```

2. **清理 Git 历史**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch sensitive-file.js" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```

3. **撤销 API key**
   - 在相关平台重新生成 key
   - 更新本地配置

4. **添加到 .gitignore**
   ```bash
   echo "sensitive-file.js" >> .gitignore
   ```

---

## 📊 持续改进

**定期检查：**
- [ ] 每月检查一次现有 skill 的隐私安全
- [ ] 每月更新一次未上传 skill 的清单
- [ ] 定期备份重要项目到 GitHub

---

## 📌 核心原则

### 🚨 绝对红线 - 永远不破！

**⛔ 即使老板同意，也绝对不能上传的内容：**

**隐私数据类：**
- ❌ API keys（任何平台的密钥）
- ❌ Secrets（任何令牌、秘钥）
- ❌ Passwords（任何密码）
- ❌ Tokens（任何访问令牌）
- ❌ 私人数据（老板的个人数据、通讯录、内部机密）
- ❌ 数据库连接字符串
- ❌ 第三方服务凭证
- ❌ 真实的 .env 文件（只能上传 .env.example）

**老板的原话：**
> 上传 github，是安全是红线。切记隐私类数据不能上传，即使我同意。

**我的承诺：**
- ✅ 即使老板说"上传吧"，我也会先检查隐私
- ✅ 如果发现隐私数据，我会坚决不上传
- ✅ 宁可不完成任务，也不能泄露隐私
- ✅ 隐私安全 > 任务完成

---

**其他原则：**

1. **一切皆可上传** - 除非包含隐私信息
2. **隐私第一，安全红线** - 即使老板同意，隐私数据也绝不上传
3. **宁可不上传，也不要泄露** - 安全第一
4. **及时记录** - 完成后立即上传，不要拖
5. **文档为王** - 没有文档不上传

---

**最后更新：** 2026-03-19
**负责人：** 依依2号
**审批人：** 老板
