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
    china: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    world: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };
  L.tileLayer(tileLayers[mapType], {
    maxZoom: 18
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
    alert('您的浏览器不支持地理位置功能');
    return;
  }

  statusElement.textContent = '📍 正在定位...';
  statusElement.style.color = '#1890ff';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      userLocation = { lat: latitude, lng: longitude };

      // 在地图上显示用户位置
      showUserLocation(userLocation);

      // 计算到热点的距离
      calculateDistances(userLocation);

      statusElement.textContent = '✅ 定位成功！';
      statusElement.style.color = '#52c41a';

      Logger.debug('用户位置', userLocation);
    },
    (error) => {
      Logger.error('定位失败', error);

      let errorMessage = '定位失败';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '您拒绝了定位请求';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '位置信息不可用';
          break;
        case error.TIMEOUT:
          errorMessage = '定位请求超时';
          break;
      }

      statusElement.textContent = `❌ ${errorMessage}`;
      statusElement.style.color = '#ff4d4f';

      // 使用默认位置（北京）
      userLocation = { lat: 39.9042, lng: 116.4074 };
      showUserLocation(userLocation);
      calculateDistances(userLocation);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000  // 5分钟缓存
    }
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

  // 创建用户位置标记
  userLocationMarker = L.marker([location.lat, location.lng], {
    icon: L.divIcon({
      className: 'user-location-marker',
      html: '<div style="font-size: 32px;">🔵</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
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

  Logger.debug('距离计算完成');
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

  Logger.debug('按距离排序完成', { count: sorted.length });
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
