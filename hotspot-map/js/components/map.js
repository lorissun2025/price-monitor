// 地图组件 - 已更新

let mapType = 'china';
let userLocationMarker = null;
let userLocation = null;

function initMap() {
  window.map = L.map('map', {
    touchZoom: false,      // 禁用触摸双指缩放
    tap: false,            // 禁用点击缩放
    doubleClickZoom: false   // 禁用双击缩放
  }).setView([36.0, 106.0], 4);  // 调整到中国中心，zoom 4

  addTileLayer();
}

function addTileLayer() {
  const tileLayers = {
    china: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    world: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    chinaSubdomains: '1234',
    worldSubdomains: '1234'
  };
  L.tileLayer(tileLayers[mapType], {
    maxZoom: 18,
    subdomains: '1234'
  }).addTo(window.map);
}

function switchMap(type) {
  mapType = type;
  document.getElementById('btn-china').classList.toggle('active', type === 'china');
  document.getElementById('btn-world').classList.toggle('active', type === 'world');
  
  const map = window.map;
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });
  
  window.hotspotLayers.forEach(layer => map.removeLayer(layer));
  window.hotspotLayers = [];
  
  addTileLayer();
  
  if (type === 'china') {
    map.setView([36.0, 106.0], 4);
  } else {
    map.setView([20, 0], 2);
  }
  
  window.renderHotspots(window.getCurrentHotspots());
}

function getMap() {
  return window.map;
}

function clearHotspots() {
  const map = window.map;
  window.hotspotLayers.forEach(layer => map.removeLayer(layer));
  window.hotspotLayers = [];
}

function fitBoundsToHotspots(hotspots) {
  const map = window.map;
  if (!hotspots || hotspots.length === 0) return;
  
  const bounds = L.latLngBounds(
    hotspots.map(h => [h.location.lat, h.location.lng])
  );
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });  // 限制最大 zoom 为 10，避免太小
}

window.switchMap = switchMap;
window.initMap = initMap;
window.getMap = getMap;
window.clearHotspots = clearHotspots;
window.fitBoundsToHotspots = fitBoundsToHotspots;

/**
 * 获取用户位置
 */
function locateUser() {
  const statusElement = document.getElementById('location-status');

  if (!navigator.geolocation) {
    statusElement.textContent = '❌ 浏览器不支持定位';
    statusElement.style.color = '#ff4d4f';
    return;
  }

  statusElement.textContent = '📍 正在定位...';
  statusElement.style.color = '#1890ff';

  // 优先使用 GeoLocation 模块
  if (typeof GeoLocation !== 'undefined') {
    GeoLocation.tryGetLocation();
    return;
  }

  // 回退：直接使用浏览器 API
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      userLocation = { lat: latitude, lng: longitude };

      showUserLocation(userLocation);
      calculateDistances(userLocation);

      // 同步到 GeoLocation
      if (typeof GeoLocation !== 'undefined') {
        GeoLocation.currentPosition = { latitude, longitude, accuracy };
        GeoLocation.showUserPosition(latitude, longitude, accuracy);
      }

      statusElement.innerHTML = `✅ 定位成功<br><small style="color:#666;">纬度: ${latitude.toFixed(4)} 经度: ${longitude.toFixed(4)}</small>`;
      statusElement.style.color = '#52c41a';

      const sortBtn = document.getElementById('sort-btn');
      if (sortBtn) sortBtn.disabled = false;

      // 设置全局用户位置供距离筛选使用
      window.userLocation = { latitude, longitude, accuracy };

      // 重新应用筛选（含距离信息）
      if (typeof window.applyCurrentFilters === 'function') {
        window.applyCurrentFilters();
        window.updateStats();
      }

      logger.debug('用户位置', userLocation);
    },
    (error) => {
      logger.error('定位失败', error);
      let errorMessage = '定位失败';
      switch (error.code) {
        case error.PERMISSION_DENIED: errorMessage = '您拒绝了定位请求'; break;
        case error.POSITION_UNAVAILABLE: errorMessage = '位置信息不可用'; break;
        case error.TIMEOUT: errorMessage = '定位请求超时'; break;
      }
      statusElement.textContent = `❌ ${errorMessage}`;
      statusElement.style.color = '#ff4d4f';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

/**
 * 在地图上显示用户位置
 */
function showUserLocation(location) {
  const map = window.map;

  // 移除旧的标记
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
  }

  // 创建用户位置标记（蓝色脉冲点）
  userLocationMarker = L.marker([location.lat, location.lng], {
    icon: L.divIcon({
      className: 'user-marker',
      html: `
        <div class="location-marker-inner">
          <div class="location-pulse"></div>
          <div class="location-dot"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }).addTo(map);

  // 添加 Popup
  userLocationMarker.bindPopup(
    '<div style="padding: 8px;"><strong>📍 您的位置</strong><br>这里就是您的当前位置！</div>'
  ).openPopup();

  // 缩放到用户位置
  map.setView([location.lat, location.lng], 10);
}

/**
 * 计算用户到热点的距离
 */
function calculateDistances(userLoc) {
  const hotspots = window.getAllHotspots();

  hotspots.forEach(hotspot => {
    const distance = calculateDistance(
      userLoc.lat,
      userLoc.lng,
      hotspot.location.lat,
      hotspot.location.lng
    );

    hotspot.distance = distance;
    hotspot.distanceText = formatDistance(distance);
  });

  logger.debug('距离计算完成');
}

/**
 * 计算两点之间的距离（Haversine 公式）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 角度转弧度
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 格式化距离显示
 */
function formatDistance(distance) {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * 按距离排序热点
 */
function sortHotspotsByDistance() {
  if (!userLocation) {
    alert('请先获取您的位置');
    return;
  }

  const sorted = window.getAllHotspots()
    .filter(h => h.distance !== undefined)
    .sort((a, b) => a.distance - b.distance);

  window.currentHotspots = sorted;
  window.renderHotspots(sorted);
  window.updateStats();
  window.fitBoundsToHotspots(sorted);

  logger.debug('按距离排序完成', { count: sorted.length });
}

/**
 * 获取用户位置
 */
function getUserLocation() {
  return userLocation;
}

window.locateUser = locateUser;
window.getUserLocation = getUserLocation;
window.sortHotspotsByDistance = sortHotspotsByDistance;
window.calculateDistance = calculateDistance;
window.formatDistance = formatDistance;
