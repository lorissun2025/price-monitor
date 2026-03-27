# HotSpot Map - 热点地图

## 部署说明

本项目已经配置好可以独立部署，不需要后端 API（使用模拟数据）。

### 快速部署到 Vercel

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **部署到 Vercel**
   ```bash
   cd hotspot-map
   vercel --prod
   ```

3. **完成！**
   - 访问 Vercel 提供的 URL
   - 地图将使用模拟数据加载 23 个热点

### 手动部署到 Vercel（网页界面）

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 导入 GitHub 仓库：`lorissun2025/hotspot-map`
3. 点击 "Deploy" 按钮
4. 等待部署完成（约 1-2 分钟）
5. 访问部署后的 URL

### 部署到 Netlify

1. 访问 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 拖拽 `hotspot-map` 文件夹到网页
3. 等待部署完成
4. 访问 Netlify 提供的 URL

## 功能特性

### v1.2 核心功能

✅ **用户位置定位** - 一键定位，查看附近热点
✅ **距离计算** - 自动计算所有热点到您的距离
✅ **距离筛选** - 按距离筛选热点（1km/5km/10km/50km）
✅ **距离排序** - 按距离从近到远排序
✅ **距离统计** - 显示最近、平均距离和分布
✅ **多平台数据** - 小红书、微博、抖音、B站（模拟数据）
✅ **地图可视化** - Leaflet + OpenStreetMap/ArcGIS
✅ **智能筛选** - 类型筛选、平台筛选
✅ **搜索功能** - 标题、城市、作者搜索（本地搜索）
✅ **统计面板** - 热点数量、分布统计

## 技术栈

- **前端：** 原生 HTML/CSS/JavaScript（无需构建）
- **地图库：** Leaflet 1.9.4
- **地图数据：** OpenStreetMap / ArcGIS
- **部署：** Vercel / Netlify（静态网站）

## 数据说明

当前版本使用 **23 个模拟热点**，涵盖：
- 4 个平台：小红书、微博、抖音、B站
- 5 种类型：美食、旅游、活动、ACG、社交热点
- 8 个城市：北京、上海、广州、成都、杭州、深圳、武汉、西安

## 后续计划

- [ ] 部署后端 API 到 Railway/Render
- [ ] 实现真实数据抓取
- [ ] 添加用户认证
- [ ] React 重构前端

## 联系方式

开发者：loris sun
项目地址：https://github.com/lorissun2025/hotspot-map
