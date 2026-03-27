# Leaflet 地图性能优化学习笔记

**学习时间：** 2026-03-23
**学习主题：** Leaflet 地图渲染和交互优化

---

## 一、热点地图项目当前的性能问题分析

### 当前实现
```javascript
// app.js - 当前实现方式
hotspots.forEach(hotspot => {
  const marker = L.marker([hotspot.lat, hotspot.lng])
    .bindPopup(createPopupContent(hotspot))
    .addTo(map);

  // 绑定事件
  marker.on('click', () => {
    showHotspotDetails(hotspot);
  });
});
```

### 潜在性能问题
1. **大量 Marker 导致渲染卡顿** - 每个热点都是一个独立的 DOM 元素
2. **Popup 内容重复创建** - 每次点击都创建新的 HTML
3. **缺乏懒加载** - 所有热点一次性加载，即使不在视野内
4. **没有虚拟滚动** - 缩放/平移时所有 Marker 都在重新渲染
5. **事件监听器过多** - 每个 Marker 都绑定事件

---

## 二、优化方案

### 方案 1：使用 Marker Cluster（聚合）

**适用场景：** 热点数量 > 50

**实现：**
```javascript
import L from 'leaflet';
import 'leaflet.markercluster';

// 创建聚类层
const markerClusterGroup = L.markerClusterGroup({
  showCoverageOnHover: false,  // 不显示覆盖范围
  zoomToBoundsOnClick: true,   // 点击缩放到范围
  disableClusteringAtZoom: 15, // 缩放级别 15 以上不聚类
  maxClusterRadius: 50,        // 最大聚类半径
  spiderfyOnMaxZoom: true,    // 最大缩放时展开
  spiderLegPolylineOptions: {
    weight: 1.5,
    color: '#333',
    opacity: 0.5
  },
  iconCreateFunction: (cluster) => {
    const count = cluster.getChildCount();
    let className = 'cluster-';
    if (count < 10) className += 'small';
    else if (count < 100) className += 'medium';
    else className += 'large';

    return L.divIcon({
      html: `<div><span>${count}</span></div>`,
      className: `marker-cluster ${className}`,
      iconSize: new L.Point(40, 40)
    });
  }
});

// 批量添加 Marker
const markers = hotspots.map(hotspot => {
  return L.marker([hotspot.lat, hotspot.lng], {
    icon: createIcon(hotspot.platform),
    title: hotspot.title
  }).bindPopup(createPopupContent(hotspot));
});

markerClusterGroup.addLayers(markers);
map.addLayer(markerClusterGroup);
```

**CSS 样式：**
```css
.marker-cluster {
  background: rgba(66, 133, 244, 0.6);
  border-radius: 50%;
  color: white;
  font-weight: bold;
  text-align: center;
}

.marker-cluster div {
  width: 30px;
  height: 30px;
  margin-left: 5px;
  margin-top: 5px;
  text-align: center;
  border-radius: 50%;
  font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
}

.marker-cluster-small {
  background-color: rgba(110, 204, 57, 0.6);
}

.marker-cluster-medium {
  background-color: rgba(241, 211, 87, 0.6);
}

.marker-cluster-large {
  background-color: rgba(253, 156, 115, 0.6);
}
```

**预期提升：**
- Marker 数量从 100+ 降到 10-20 个（聚合后）
- 初始渲染时间减少 70-80%
- 缩放/平移更流畅

---

### 方案 2：Canvas 渲染（高性能）

**适用场景：** 热点数量 > 500

**实现：**
```javascript
import L from 'leaflet';

class CanvasIconLayer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.icons = [];
  }

  addTo(map) {
    map.on('moveend', this.draw.bind(this));
    map.on('zoomend', this.draw.bind(this));
    map.on('resize', this.draw.bind(this));
    this.map = map;
    this.resize();
  }

  resize() {
    const size = this.map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.map.getPanes().overlayPane.appendChild(this.canvas);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();

    // 只绘制视野内的图标
    hotspots.forEach(hotspot => {
      if (bounds.contains([hotspot.lat, hotspot.lng])) {
        const point = this.map.latLngToContainerPoint([hotspot.lat, hotspot.lng]);
        this.drawIcon(point, hotspot);
      }
    });
  }

  drawIcon(point, hotspot) {
    const icon = this.getIcon(hotspot.platform);
    this.ctx.drawImage(icon, point.x - 12, point.y - 24, 24, 24);
  }

  getIcon(platform) {
    // 返回预渲染的图标
  }
}
```

**预期提升：**
- 支持数千个 Marker
- 渲染性能提升 10 倍以上
- 适合大数据量场景

---

### 方案 3：懒加载和虚拟滚动

**适用场景：** 热点数量 > 1000

**实现：**
```javascript
class LazyMarkerLayer {
  constructor(hotspots, map) {
    this.hotspots = hotspots;
    this.map = map;
    this.visibleMarkers = new Map();
    this.loadedBounds = null;

    // 监听地图移动
    map.on('moveend', this.updateVisibleMarkers.bind(this));
    map.on('zoomend', this.updateVisibleMarkers.bind(this));
  }

  updateVisibleMarkers() {
    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();

    // 计算视野内的热点（扩大范围以提供缓冲）
    const buffer = bounds.getSize().x * 0.2; // 20% 缓冲区
    const bufferedBounds = bounds.pad(0.2);

    // 找出视野内且未加载的热点
    const newVisible = this.hotspots.filter(hotspot => {
      const point = this.map.latLngToContainerPoint([hotspot.lat, hotspot.lng]);
      const x = point.x;
      const y = point.y;
      const mapSize = this.map.getSize();

      return x >= -buffer && x <= mapSize.x + buffer &&
             y >= -buffer && y <= mapSize.y + buffer;
    });

    // 移除视野外的 Marker
    this.visibleMarkers.forEach((marker, id) => {
      const hotspot = this.hotspots.find(h => h.id === id);
      if (!hotspot || !bufferedBounds.contains([hotspot.lat, hotspot.lng])) {
        this.map.removeLayer(marker);
        this.visibleMarkers.delete(id);
      }
    });

    // 添加新的 Marker
    newVisible.forEach(hotspot => {
      if (!this.visibleMarkers.has(hotspot.id)) {
        const marker = L.marker([hotspot.lat, hotspot.lng], {
          icon: this.createIcon(hotspot.platform)
        }).bindPopup(this.createPopup(hotspot));

        this.map.addLayer(marker);
        this.visibleMarkers.set(hotspot.id, marker);
      }
    });
  }

  createIcon(platform) {
    // 创建图标
    return L.icon({
      iconUrl: `/icons/${platform}.png`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  }

  createPopup(hotspot) {
    // 复用 Popup 内容
    return L.popup({
      maxWidth: 300
    }).setContent(this.getPopupContent(hotspot));
  }

  getPopupContent(hotspot) {
    // 缓存 Popup 内容
    if (!this.popupCache) {
      this.popupCache = new Map();
    }

    if (!this.popupCache.has(hotspot.id)) {
      const content = `
        <div class="hotspot-popup">
          <h3>${hotspot.title}</h3>
          <p><strong>平台:</strong> ${hotspot.platform}</p>
          <p><strong>类型:</strong> ${hotspot.type}</p>
          <p><strong>热度:</strong> ${hotspot.heat}</p>
          <p><strong>城市:</strong> ${hotspot.city}</p>
          <a href="${hotspot.url}" target="_blank">查看详情</a>
        </div>
      `;
      this.popupCache.set(hotspot.id, content);
    }

    return this.popupCache.get(hotspot.id);
  }
}
```

**预期提升：**
- 只加载视野内的 Marker（减少 80-90% DOM 元素）
- 缓存 Popup 内容（避免重复创建）
- 内存使用减少 70%

---

### 方案 4：优化 Popup 性能

**问题：** 当前每次点击都创建新的 Popup 内容

**优化：**
```javascript
// 1. 预创建 Popup 模板
const popupTemplate = document.createElement('div');
popupTemplate.className = 'hotspot-popup';

// 2. 缓存 Popup 内容
const popupCache = new Map();

function getCachedPopup(hotspot) {
  if (popupCache.has(hotspot.id)) {
    return popupCache.get(hotspot.id);
  }

  const content = popupTemplate.cloneNode(true);
  content.innerHTML = `
    <h3>${hotspot.title}</h3>
    <p><strong>平台:</strong> ${hotspot.platform}</p>
    <p><strong>类型:</strong> ${hotspot.type}</p>
    <p><strong>热度:</strong> ${hotspot.heat}</p>
    <p><strong>城市:</strong> ${hotspot.city}</p>
    <a href="${hotspot.url}" target="_blank">查看详情</a>
  `;

  popupCache.set(hotspot.id, content);
  return content;
}

// 3. 使用 L.popup 的 autoPan 和 autoPanPadding
const marker = L.marker([lat, lng]).bindPopup(getCachedPopup(hotspot), {
  maxWidth: 300,
  minWidth: 250,
  autoPan: true,  // 自动平移以显示 Popup
  autoPanPadding: [50, 50],  // 留出边距
  closeButton: true,
  className: 'custom-popup'
});
```

**CSS 优化：**
```css
.hotspot-popup {
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.hotspot-popup h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.hotspot-popup p {
  margin: 4px 0;
  color: #666;
}

.hotspot-popup a {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  background: #4285f4;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 12px;
}

.hotspot-popup a:hover {
  background: #3367d6;
}
```

---

### 方案 5：使用 Web Workers 处理大数据

**适用场景：** 需要复杂计算（如热度分析、聚类）

**主线程代码：**
```javascript
// 主线程
const worker = new Worker('/js/workers/hotspot-worker.js');

// 发送数据到 Worker
worker.postMessage({
  action: 'calculateHeatmap',
  hotspots: hotspots,
  bounds: map.getBounds(),
  zoom: map.getZoom()
});

// 接收结果
worker.onmessage = (event) => {
  const { heatmapData } = event.data;
  renderHeatmap(heatmapData);
};
```

**Worker 代码（hotspot-worker.js）：**
```javascript
// 接收主线程消息
self.onmessage = function(event) {
  const { action, hotspots, bounds, zoom } = event.data;

  if (action === 'calculateHeatmap') {
    const heatmapData = calculateHeatmap(hotspots, bounds, zoom);
    self.postMessage({ heatmapData });
  }
};

function calculateHeatmap(hotspots, bounds, zoom) {
  // 在 Worker 中进行复杂计算
  const gridSize = Math.pow(2, zoom) * 50;
  const grid = new Map();

  hotspots.forEach(hotspot => {
    if (bounds.contains([hotspot.lat, hotspot.lng])) {
      const gridX = Math.floor((hotspot.lng - bounds.getWest()) / gridSize);
      const gridY = Math.floor((hotspot.lat - bounds.getSouth()) / gridSize);
      const key = `${gridX},${gridY}`;

      if (!grid.has(key)) {
        grid.set(key, { count: 0, totalHeat: 0 });
      }

      const cell = grid.get(key);
      cell.count++;
      cell.totalHeat += hotspot.heat;
    }
  });

  return Array.from(grid.entries()).map(([key, value]) => {
    const [gridX, gridY] = key.split(',').map(Number);
    const lat = bounds.getSouth() + gridY * gridSize;
    const lng = bounds.getWest() + gridX * gridSize;
    const heat = value.totalHeat / value.count;

    return { lat, lng, heat, count: value.count };
  });
}
```

**预期提升：**
- 复杂计算不阻塞 UI 线程
- 支持更大规模数据（10,000+ 热点）
- 用户交互保持流畅

---

## 三、综合优化方案

### 实施优先级

**阶段 1：基础优化（立即实施）**
1. ✅ Popup 内容缓存
2. ✅ 优化 Popup CSS
3. ✅ 移除不必要的事件监听器

**阶段 2：中级优化（热点数量 50-100）**
1. ✅ 使用 MarkerCluster 聚合
2. ✅ 实现懒加载
3. ✅ 添加滚动/缩放节流

**阶段 3：高级优化（热点数量 100+）**
1. ✅ Canvas 渲染
2. ✅ Web Workers 处理大数据
3. ✅ IndexedDB 本地缓存

---

## 四、性能测试工具

### 使用 Lighthouse 测试
```bash
# 安装 Lighthouse CLI
npm install -g lighthouse

# 测试热点地图
lighthouse http://localhost:8000 --output html --output-path ./lighthouse-report.html
```

### 关键指标
- **First Contentful Paint (FCP):** 首次内容绘制 < 1.5s
- **Largest Contentful Paint (LCP):** 最大内容绘制 < 2.5s
- **Time to Interactive (TTI):** 可交互时间 < 3.5s
- **Total Blocking Time (TBT):** 总阻塞时间 < 200ms
- **Cumulative Layout Shift (CLS):** 累积布局偏移 < 0.1

---

## 五、学习总结

**核心原则：**
1. **减少 DOM 元素** - 聚合、懒加载、虚拟滚动
2. **优化渲染** - Canvas > SVG > DOM
3. **缓存复用** - Popup、图标、数据
4. **异步计算** - Web Workers 处理复杂任务
5. **按需加载** - 只加载视野内内容

**预期效果：**
- 初始加载时间减少 60-80%
- 缩放/平移流畅度提升 3-5 倍
- 支持 10 倍以上的数据量
- 内存使用减少 50-70%

**下一步：**
1. 在热点地图项目中实施阶段 1 优化
2. 测试性能提升效果
3. 根据实际数据量决定是否实施阶段 2/3 优化

---

**依依2号 - 2026-03-23**
**学习主题：Leaflet 地图性能优化**
