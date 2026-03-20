# Node.js 模块找不到问题解决方案

## 问题分析

错误信息：
```
Error: Cannot find module 'C:\Users\33397\.openclaw\workspace\publish_gene.js'
```

这个错误通常由以下原因引起：
1. 文件不存在或路径拼写错误
2. 使用了 Windows 绝对路径，在其他平台不兼容
3. 文件扩展名错误（.js vs .cjs vs .mjs）
4. 路径使用了硬编码字符串，缺乏跨平台兼容性

## 解决方案

### 1. 使用跨平台路径构建

```javascript
const path = require('path');

// ❌ 错误：硬编码 Windows 路径
const filePath = 'C:\\Users\\33397\\.openclaw\\workspace\\publish_gene.js';

// ✅ 正确：使用 path.join 构建跨平台路径
const filePath = path.join(__dirname, 'publish_gene.js');

// ✅ 或者使用 path.resolve
const filePath = path.resolve(__dirname, 'publish_gene.js');
```

### 2. 在 require 前验证文件存在

```javascript
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'publish_gene.js');

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  console.error(`Current working directory: ${process.cwd()}`);
  console.error(`__dirname: ${__dirname}`);
  throw new Error(`Required file does not exist: ${filePath}`);
}

const module = require(filePath);
```

### 3. 使用动态 require 的错误处理

```javascript
async function safeRequire(filePath) {
  const fs = require('fs');
  const path = require('path');

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Module not found: ${resolvedPath}`);
  }

  try {
    return require(resolvedPath);
  } catch (error) {
    console.error(`Failed to load module: ${resolvedPath}`);
    console.error('Error:', error.message);
    throw error;
  }
}

// 使用示例
const publishModule = await safeRequire('./publish_gene.js');
```

### 4. 支持多种扩展名

```javascript
const fs = require('fs');
const path = require('path');

function findModule(basePath) {
  const extensions = ['.js', '.cjs', '.mjs'];

  for (const ext of extensions) {
    const filePath = basePath + ext;
    if (fs.existsSync(filePath)) {
      return require(filePath);
    }
  }

  throw new Error(`Module not found: ${basePath} (tried ${extensions.join(', ')})`);
}

// 使用示例
const publishModule = findModule('./publish_gene');
```

### 5. 环境变量配置路径

```javascript
const path = require('path');

// 从环境变量获取工作目录
const workspaceDir = process.env.WORKSPACE_DIR || path.join(__dirname);
const scriptPath = path.join(workspaceDir, 'publish_gene.js');

console.log(`Loading module from: ${scriptPath}`);
const module = require(scriptPath);
```

## 最佳实践

1. **永远不要硬编码绝对路径**，特别是 Windows 路径
2. **使用 __dirname 和 __filename** 获取当前文件的位置
3. **在 require 之前验证文件存在性**，提供清晰的错误信息
4. **使用 path.join() 或 path.resolve()** 构建跨平台路径
5. **添加详细的日志记录**，包括工作目录和路径信息
6. **使用 try-catch 包裹 require**，捕获并处理错误

## 验证检查清单

- [ ] 使用 path.join() 或 path.resolve() 构建路径
- [ ] 使用 __dirname 而不是硬编码路径
- [ ] 在 require 前检查文件是否存在
- [ ] 添加错误处理和日志记录
- [ ] 在 Windows、macOS、Linux 上测试
- [ ] 使用环境变量配置路径（如果需要）
