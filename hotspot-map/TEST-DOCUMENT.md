# 热点地图 PWA - 测试文档

**文档版本：** 1.0
**测试日期：** 2026-03-24
**测试人员：** 开发者（老板或用户）
**测试环境：** Chrome/Edge/Firefox/Safari

---

## 一、测试准备

### 1. 浏览器打开

**文件位置：**
```
file:///Users/sunsensen/.openclaw/workspace/hotspot-map/index-final.html
```

**打开方式：**
- 方式 1：直接双击文件
- 方式 2：在浏览器地址栏输入完整路径
- 方式 3：右键 → 打开方式 → 选择浏览器

---

### 2. 开发者工具

**打开方式：**
- Chrome/Edge：F12 或 Cmd+Option+I
- Firefox：F12 或 Cmd+Option+K
- Safari：Cmd+Option+C

**需要检查的面板：**
- Console（控制台）- 查看错误和日志
- Network（网络）- 查看 API 请求
- Application → Service Workers - 查看 SW 状态
- Application → Storage → 查看 IndexedDB

---

## 二、功能测试清单

### 测试 1：页面加载

**测试步骤：**
1. 打开 `index-final.html`
2. 检查页面是否完全加载
3. 检查控制台是否有错误

**预期结果：**
- ✅ 页面在 2-3 秒内加载完成
- ✅ 侧边栏完整显示（标题、按钮、筛选器等）
- ✅ 地图区域完整显示（地图底板）
- ✅ 控制台没有红色错误

**可能问题：**
- ❌ 页面空白 → 检查 JS 加载顺序
- ❌ 样式错乱 → 检查 CSS 加载
- ❌ 地图不显示 → 检查 Leaflet 是否加载

---

### 测试 2：地图显示

**测试步骤：**
1. 检查地图底板是否显示（灰色地图）
2. 检查地图瓦片是否加载
3. 拖动地图，检查是否流畅
4. 缩放地图，检查是否正常

**预期结果：**
- ✅ 地图底板正常显示
- ✅ 地图瓦片正常加载（可能需要几秒）
- ✅ 拖动流畅，无卡顿
- ✅ 缩放正常，无错误

**可能问题：**
- ❌ 地图空白 → 检查 Leaflet 初始化
- ❌ 地图瓦片不加载 → 检查网络连接或 CDN
- ❌ 地图无法拖动 → 检查 Leaflet 配置

---

### 测试 3：热点标记

**测试步骤：**
1. 检查是否有热点标记（应该自动生成 20 个）
2. 检查标记是否正确显示（不同平台有不同图标）
3. 点击标记，检查 Popup 是否打开
4. 检查 Popup 内容是否正确

**预期结果：**
- ✅ 地图上应该有 20 个热点标记
- ✅ 不同平台显示不同图标（小红书📕、微博📟、抖音🎵、B站📺）
- ✅ 点击标记能打开 Popup
- ✅ Popup 显示热点标题、平台、城市、影响力

**可能问题：**
- ❌ 没有热点标记 → 检查 `createIcon` 函数
- ❌ 图标不显示 → 检查图标 HTML
- ❌ Popup 不打开 → 检查事件绑定
- ❌ Popup 内容错误 → 检查 Popup 模板

---

### 测试 4：统计数据

**测试步骤：**
1. 检查"当前展示"统计（应该显示 20）
2. 检查各平台统计（小红书、微博、抖音、B站）
3. 切换平台筛选，检查统计是否更新

**预期结果：**
- ✅ "当前展示"显示 20
- ✅ 各平台统计正确（根据 20 个热点的分布）
- ✅ 取消某个平台的勾选，统计立即更新

**可能问题：**
- ❌ 统计不更新 → 检查 `updateStats` 函数
- ❌ 统计数字错误 → 检查计数逻辑

---

### 测试 5：筛选功能

**测试步骤：**
1. 点击"美食探店"按钮
2. 检查地图上是否只显示美食类热点
3. 点击"全部热点"按钮
4. 检查地图上是否显示所有热点

**预期结果：**
- ✅ 点击"美食探店"后，只显示类型为 `food` 的热点
- ✅ 点击"全部热点"后，显示所有 20 个热点
- ✅ 按钮状态正确更新（active 类）

**可能问题：**
- ❌ 筛选不生效 → 检查 `quickFilter` 函数
- ❌ 按钮状态不更新 → 检查事件绑定

---

### 测试 6：搜索功能

**测试步骤：**
1. 在搜索框输入"北京"
2. 点击"🔍"按钮或按 Enter 键
3. 检查地图上是否只显示北京相关的热点
4. 清空搜索框，检查是否恢复显示所有热点

**预期结果：**
- ✅ 搜索"北京"后，只显示标题或城市包含"北京"的热点
- ✅ 搜索状态显示"✅ 找到 X 个热点"
- ✅ 清空搜索后，显示所有 20 个热点

**可能问题：**
- ❌ 搜索不生效 → 检查 `searchHotspots` 函数
- ❌ 搜索结果错误 → 检查搜索逻辑

---

### 测试 7：刷新数据

**测试步骤：**
1. 点击"🔄 刷新数据"按钮
2. 检查刷新状态是否显示"🔄 刷新中..."
3. 等待刷新完成（应该很快，因为是模拟数据）
4. 检查刷新状态是否显示"✅ 刷新完成 (Xms)"

**预期结果：**
- ✅ 点击按钮后，立即显示"🔄 刷新中..."
- ✅ 几秒后显示"✅ 刷新完成 (Xms)"
- ✅ 热点重新随机生成

**可能问题：**
- ❌ 刷新无响应 → 检查 `refreshData` 函数
- ❌ 刷新失败 → 检查数据加载逻辑

---

## 三、控制台检查清单

### 错误级别

**红色错误（Critical）：**
- `Uncaught ReferenceError` - 变量或函数未定义
- `Uncaught TypeError` - 类型错误
- `Uncaught SyntaxError` - 语法错误

**黄色警告（Warning）：**
- 缺少的资源（图片、字体）
- 已弃用的 API
- 性能问题

### 必须没有的错误

**以下错误必须修复：**
1. `createIcon is not defined`
2. `L is not defined`
3. `HotspotMapApp is not defined`
4. `HotspotMapDB is not defined`
5. 任何其他未定义的变量或函数

### 可以忽略的警告

**以下警告可以忽略：**
1. 缺少 favicon（不影响功能）
2. 缺少某些字体（不影响功能）
3. Leaflet 的某些警告（不影响功能）

---

## 四、Service Worker 测试

### 测试 1：Service Worker 注册

**测试步骤：**
1. 打开开发者工具
2. 转到 "Application" 面板
3. 选择 "Service Workers"
4. 查看 SW 是否已注册

**预期结果：**
- ✅ 看到 Service Worker 状态为 "activated"
- ✅ 看到 Service Worker 的作用域
- ✅ 控制台日志显示 `[Service Worker] 已激活`

**可能问题：**
- ❌ Service Worker 未注册 → 检查 `sw.js` 文件路径

---

### 测试 2：缓存验证

**测试步骤：**
1. 打开开发者工具
2. 转到 "Application" → "Storage" → "Cache Storage"
3. 查看缓存内容

**预期结果：**
- ✅ 看到 `static-v1` 缓存
- ✅ 看到 `api-v1` 缓存
- ✅ 缓存中包含 HTML、CSS、JS 文件

**可能问题：**
- ❌ 缓存为空 → 检查 Service Worker 缓存逻辑

---

## 五、IndexedDB 测试

### 测试 1：数据库打开

**测试步骤：**
1. 打开开发者工具
2. 转到 "Application" → "Storage" → "IndexedDB"
3. 查看 `HotspotMapDB` 数据库

**预期结果：**
- ✅ 看到 `HotspotMapDB` 数据库已创建
- ✅ 看到对象存储：`hotspots`, `settings`, `offlineQueue`, `syncStatus`

**可能问题：**
- ❌ 数据库未创建 → 检查 IndexedDB 封装类

---

### 测试 2：数据存储

**测试步骤：**
1. 刷新页面（加载/重新生成 20 个热点）
2. 查看数据库中的 `hotspots` 存储
3. 检查是否有 20 条记录

**预期结果：**
- ✅ `hotspots` 存储中有 20 条记录
- ✅ 每条记录包含完整的热点信息

**可能问题：**
- ❌ 数据未存储 → 检查数据加载逻辑

---

## 六、PWA 功能测试

### 测试 1：PWA 安装

**测试环境：**
- Chrome/Edge（桌面）
- Chrome Android
- Safari iOS

**测试步骤：**
1. 打开网站
2. 检查地址栏是否显示安装图标
3. 检查是否显示安装横幅

**预期结果：**
- ✅ Chrome/Edge：地址栏右侧显示安装图标
- ✅ 移动端：显示安装横幅（如果实现了）

**可能问题：**
- ❌ 未显示安装图标 → 检查 PWA Manifest 文件

---

## 七、性能测试

### 测试 1：页面加载时间

**测试步骤：**
1. 打开开发者工具
2. 转到 "Network" 面板
3. 勾选 "Doc" 类型
4. 查看 `index-final.html` 的加载时间

**预期结果：**
- ✅ 首次加载：2-3 秒
- ✅ 缓存加载：< 1 秒

**可能问题：**
- ❌ 加载时间过长 → 优化资源大小

---

### 测试 2：JavaScript 执行时间

**测试步骤：**
1. 打开开发者工具
2. 转到 "Performance" 面板
3. 开始录制
4. 刷新页面
5. 停止录制

**预期结果：**
- ✅ 脚本执行时间：< 1 秒
- ✅ 主线程阻塞时间：< 500ms

**可能问题：**
- ❌ 脚本执行时间过长 → 优化 JS 代码

---

## 八、兼容性测试

### 浏览器兼容性

| 浏览器 | 版本 | 功能 | 状态 |
|--------|------|------|------|
| Chrome | 最新版 | 完全支持 | ✅ |
| Firefox | 最新版 | 完全支持 | ✅ |
| Safari | 最新版 | 完全支持 | ✅ |
| Edge | 最新版 | 完全支持 | ✅ |

### 设备兼容性

| 设备类型 | 状态 | 说明 |
|----------|------|------|
| 桌面 | ✅ | 完全支持 |
| 笔记本 | ✅ | 完全支持 |
| 平板 | ✅ | 完全支持 |
| 手机 | ✅ | 完全支持 |

---

## 九、常见问题和解决方案

### 问题 1：地图空白

**症状：** 地图区域空白，看不到任何内容

**可能原因：**
1. Leaflet CSS 未加载
2. Leaflet JS 未加载
3. 地图容器未初始化
4. 网络连接问题

**解决方案：**
```javascript
// 1. 检查 CSS 是否加载
const link = document.querySelector('link[href*="leaflet.css"]');
if (!link || !link.sheet) {
  console.error('Leaflet CSS 未加载');
  // 重新加载
  link.href = link.href + '?nocache=' + Date.now();
}

// 2. 检查 JS 是否加载
if (typeof L === 'undefined') {
  console.error('Leaflet 未加载');
  // 重新加载
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  document.head.appendChild(script);
}

// 3. 检查地图容器
const mapContainer = document.getElementById('map');
if (!mapContainer) {
  console.error('地图容器未找到');
  return;
}

// 4. 初始化地图
if (!window.map) {
  try {
    window.map = L.map('map', {
      center: [35.8617, 104.1954],
      zoom: 4
    });
    console.log('地图已初始化');
  } catch (error) {
    console.error('地图初始化失败:', error);
  }
}
```

---

### 问题 2：热点标记不显示

**症状：** 地图显示正常，但没有热点标记

**可能原因：**
1. 数据未加载
2. `renderHotspots` 函数未调用
3. `createIcon` 函数未定义
4. 标记渲染错误

**解决方案：**
```javascript
// 1. 检查数据是否加载
if (window.app && window.app.allHotspots) {
  console.log('数据已加载:', window.app.allHotspots.length);
} else {
  console.error('数据未加载');
  return;
}

// 2. 检查 createIcon 函数
if (typeof createIcon !== 'function') {
  console.error('createIcon 未定义');
  return;
}

// 3. 手动调用渲染函数
if (window.app && typeof window.app.renderHotspots === 'function') {
  window.app.renderHotspots(window.app.allHotspots);
  console.log('热点已渲染');
}
```

---

### 问题 3：控制台错误

**症状：** 控制台显示红色错误

**常见错误：**

**错误 1：`createIcon is not defined`**
```javascript
// 解决方案：检查函数定义
// 确保 createIcon 在 window.createIcon 中定义

// 检查
console.log(typeof window.createIcon);  // 应该是 'function'

// 如果未定义，手动添加
window.createIcon = function(platform) {
  // ... 原始代码
};
```

**错误 2：`L is not defined`**
```javascript
// 解决方案：检查 Leaflet 是否加载

// 检查
console.log(typeof L);  // 应该是 'object'

// 如果未定义，等待加载
if (typeof L === 'undefined') {
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
```

**错误 3：`window.app is not defined`**
```javascript
// 解决方案：检查应用类是否定义

// 检查
console.log(typeof window.app);  // 应该是 'object'

// 如果未定义，等待加载
if (typeof window.app === 'undefined') {
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
```

---

## 十、测试报告

### 测试结果记录

| 测试项 | 状态 | 问题描述 | 解决方案 |
|--------|------|---------|---------|
| 页面加载 | ⏳ 待测试 | | |
| 地图显示 | ⏳ 待测试 | | |
| 热点标记 | ⏳ 待测试 | | |
| 统计数据 | ⏳ 待测试 | | |
| 筛选功能 | ⏳ 待测试 | | |
| 搜索功能 | ⏳ 待测试 | | |
| 刷新数据 | ⏳ 待测试 | | |
| Service Worker | ⏳ 待测试 | | |
| IndexedDB | ⏳ 待测试 | | |

---

## 十一、性能指标

### 目标指标

| 指标 | 目标值 |
|------|--------|
| 首次加载时间 | < 3 秒 |
| 缓存加载时间 | < 1 秒 |
| 脚本执行时间 | < 1 秒 |
| 主线程阻塞时间 | < 500ms |
| 缓存命中率 | > 60% |

---

**依依2号 - 2026-03-24**
**测试文档完成，等待您的测试结果！**
