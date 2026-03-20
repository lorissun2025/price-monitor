# 热点地图系统 v1.2 开发计划

## 📅 开发日期
2026-03-19

## 🎯 核心目标

实现用户位置定位和距离计算功能，让用户能够查看附近的热点，并按距离筛选。

## 🚀 新增功能

### 1. 用户位置定位
- **自动定位**: 使用浏览器 Geolocation API 获取用户位置
- **定位权限处理**: 优雅的权限请求和错误处理
- **位置标记**: 在地图上显示用户当前位置
- **位置缓存**: 缓存用户位置，避免重复请求

### 2. 距离计算
- **距离算法**: 使用 Haversine 公式计算两点间距离
- **单位显示**: 支持 km 和 m 自动切换
- **实时计算**: 点击热点时显示距离
- **批量计算**: 计算所有热点的距离并排序

### 3. 距离筛选
- **距离滑块**: 支持按距离筛选（1km, 5km, 10km, 50km, 全部）
- **距离标签**: 在热点标记上显示距离
- **距离排序**: 按距离从近到远排序
- **距离统计**: 显示最近的热点和平均距离

### 4. 热点详情页面（优化）
- **距离显示**: 详情页面显示距离信息
- **导航链接**: 链接到地图导航（高德/百度地图）
- **分享位置**: 一键分享热点位置

## 🏗️ 技术实现

### 用户定位
```javascript
// 使用 Geolocation API
navigator.geolocation.getCurrentPosition(
  (position) => {
    // 成功回调
    const { latitude, longitude } = position.coords;
    updateUserLocation(latitude, longitude);
  },
  (error) => {
    // 错误处理
    handleLocationError(error);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 600000
  }
);
```

### 距离计算（Haversine 公式）
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（km）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 返回 km
}
```

### 距离标签
```javascript
// 在 Popup 中显示距离
popupContent += `
  <div class="distance">
    <span class="label">距离:</span>
    <span class="value">${distance}km</span>
  </div>
`;
```

## 📊 数据结构更新

### 热点数据扩展
```javascript
{
  id: 1,
  title: "成都火锅探店",
  type: "美食",
  platform: "小红书",
  city: "成都",
  lat: 30.5728,
  lng: 104.0668,
  // 新增
  distance: null, // 距离用户位置（km）
  calculated: false // 是否已计算距离
}
```

### 用户位置数据
```javascript
{
  latitude: null,
  longitude: null,
  accuracy: null,
  timestamp: null,
  enabled: false // 是否已授权定位
}
```

## 🎨 UI/UX 设计

### 定位按钮
- 位置：地图右下角，与缩放控件平行
- 图标：定位图标（SVG）
- 状态：
  - 未定位：灰色图标
  - 定位中：加载动画
  - 已定位：蓝色图标
- 点击：触发定位

### 距离筛选器
- 位置：侧边栏，在类型筛选器下方
- 控件：距离滑块 + 快捷按钮
- 选项：1km, 5km, 10km, 50km, 全部
- 实时更新：拖动滑块时实时筛选

### 距离标签
- 位置：热点标记下方
- 样式：小字体，灰色背景
- 显示：定位后自动显示

### 距离统计
- 位置：统计面板中新增
- 内容：
  - 最近热点距离
  - 平均距离
  - 5km/10km 内的热点数量

## 📁 文件变更

### 新增文件
- `js/utils/geo.js` - 地理位置工具（距离计算、定位处理）
- `js/components/location.js` - 定位组件（定位按钮、位置标记）
- `js/components/distance-filter.js` - 距离筛选组件

### 修改文件
- `index.html` - 添加定位按钮和距离筛选器 UI
- `css/styles.css` - 添加定位和距离相关样式
- `js/app.js` - 集成定位和距离功能
- `js/components/map.js` - 添加用户位置标记
- `js/components/popup.js` - 添加距离显示
- `js/components/stats.js` - 添加距离统计

## 🔧 API 更新

### 新增端点
```
GET /api/hotspots/nearby?lat=30.5728&lng=104.0668&radius=10
```
- 参数：
  - lat: 用户纬度
  - lng: 用户经度
  - radius: 搜索半径（km）
- 返回：指定范围内的热点列表（按距离排序）

### 修改端点
```
GET /api/hotspots
```
- 新增参数：
  - userLat: 用户纬度
  - userLng: 用户经度
- 返回数据中包含 distance 字段

## 📝 实现步骤

### 阶段 1：地理工具（30分钟）✅ 已完成
- [x] 创建 `js/utils/geo.js`
- [x] 实现 Haversine 距离计算函数
- [x] 实现定位权限处理函数
- [x] 实现距离格式化函数（km/m）
- [x] 编写辅助函数（批量计算、排序、筛选）

### 阶段 2：定位功能（1小时）✅ 已完成
- [x] 创建 `js/components/location.js`
- [x] 实现定位按钮 UI
- [x] 实现定位逻辑
- [x] 实现位置标记
- [x] 实现错误处理
- [x] 添加位置缓存

### 阶段 3：距离计算（45分钟）✅ 已完成
- [x] 在热点数据中添加 distance 字段
- [x] 实现批量距离计算
- [x] 实现距离排序
- [x] 在 Popup 中显示距离
- [x] 在标记上显示距离标签

### 阶段 4：距离筛选（1小时）✅ 已完成
- [x] 创建 `js/components/distance-filter.js`
- [x] 实现距离筛选器 UI
- [x] 实现距离筛选逻辑
- [x] 实现快捷按钮
- [x] 集成到侧边栏

### 阶段 5：距离统计（30分钟）✅ 已完成
- [x] 在统计面板中添加距离统计
- [x] 显示最近热点距离
- [x] 显示平均距离
- [x] 显示范围内的热点数量

### 阶段 6：UI 样式（30分钟）✅ 已完成
- [x] 添加定位按钮样式
- [x] 添加距离筛选器样式
- [x] 添加距离标签样式
- [x] 响应式适配

### 阶段 7：测试和优化（45分钟）⏳ 待测试
- [ ] 测试定位功能
- [ ] 测试距离计算
- [ ] 测试距离筛选
- [ ] 测试边界情况
- [ ] 性能优化

### 阶段 8：文档更新（15分钟）⏳ 进行中
- [x] 更新 CHANGELOG-v1.2.md
- [ ] 更新 README.md
- [ ] 添加使用示例

## 🚧 已知问题

1. **定位权限**: 用户可能拒绝定位权限
2. **定位精度**: Geolocation API 精度有限
3. **距离误差**: Haversine 公式计算的是直线距离，实际道路距离可能不同
4. **性能**: 计算所有热点的距离可能影响性能

## 🔮 未来计划

### v1.3
- [ ] 热点趋势分析
- [ ] 时间范围筛选
- [ ] 历史数据查看
- [ ] 数据导出功能

### v2.0
- [ ] React 重构
- [ ] AI 驱动功能
- [ ] 实时数据流
- [ ] 企业级功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**开发者**: loris sun
**版本**: v1.2（开发中）
**更新日期**: 2026-03-19
