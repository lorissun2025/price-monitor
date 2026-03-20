// 地理位置 API 工具
// 提供用户位置获取、显示和管理功能

const GeoLocation = {
  // 当前用户位置
  currentPosition: null,

  // 用户位置标记
  userMarker: null,

  // 位置精度圆
  accuracyCircle: null,

  /**
   * 初始化地理位置功能
   * @param {Object} map - Leaflet 地图实例
   */
  init: function(map) {
    this.map = map;
    this.tryGetLocation();

    // 添加重新定位按钮（如果地图容器存在）
    if (document.getElementById('map')) {
      this.addRecenterButton();
    }
  },

  /**
   * 尝试获取用户位置
   */
  tryGetLocation: function() {
    if (!navigator.geolocation) {
      Logger.warn('您的浏览器不支持地理位置 API');
      this.showError('您的浏览器不支持地理位置功能');
      return;
    }

    Logger.debug('正在请求用户位置');

    navigator.geolocation.getCurrentPosition(
      (position) => this.onSuccess(position),
      (error) => this.onError(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  },

  /**
   * 位置获取成功
   */
  onSuccess: function(position) {
    const { latitude, longitude, accuracy } = position.coords;

    this.currentPosition = {
      latitude,
      longitude,
      accuracy,
      timestamp: Date.now()
    };

    Logger.debug('获取位置成功', this.currentPosition);

    // 显示用户位置
    this.showUserPosition(latitude, longitude, accuracy);

    // 调整地图中心
    this.map.setView([latitude, longitude], 12);

    // 触发自定义事件
    this.dispatchPositionEvent(this.currentPosition);
  },

  /**
   * 位置获取失败
   */
  onError: function(error) {
    Logger.error('获取位置失败', error);

    let message = '';
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = '您拒绝了位置访问权限';
        break;
      case error.POSITION_UNAVAILABLE:
        message = '无法获取位置信息';
        break;
      case error.TIMEOUT:
        message = '获取位置超时';
        break;
      default:
        message = '未知错误';
    }

    this.showError(message);

    // 触发错误事件
    this.dispatchErrorEvent(error);
  },

  /**
   * 在地图上显示用户位置
   */
  showUserPosition: function(latitude, longitude, accuracy) {
    // 移除旧的标记
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }
    if (this.accuracyCircle) {
      this.map.removeLayer(this.accuracyCircle);
    }

    // 创建位置精度圆
    this.accuracyCircle = L.circle([latitude, longitude], {
      color: '#4285F4',
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      radius: accuracy || 100,
      weight: 1
    }).addTo(this.map);

    // 创建用户位置标记
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #4285F4;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.userMarker = L.marker([latitude, longitude], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('📍 您的位置')
      .openPopup();
  },

  /**
   * 添加重新定位按钮
   */
  addRecenterButton: function() {
    const btn = L.control({ position: 'topright' });

    btn.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');

      const button = L.DomUtil.create('a', 'leaflet-control-locate', div);
      button.href = '#';
      button.innerHTML = '📍';
      button.title = '重新定位';
      button.style.padding = '5px 10px';
      button.style.fontSize = '18px';

      L.DomEvent.on(button, 'click', L.DomEvent.stop)
        .on(button, 'click', () => {
          GeoLocation.tryGetLocation();
        });

      return div;
    };

    btn.addTo(this.map);
  },

  /**
   * 显示错误提示
   */
  showError: function(message) {
    console.warn(message);

    // 创建 toast 提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: #f44336;
      color: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // 5 秒后自动消失
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },

  /**
   * 触发位置获取成功事件
   */
  dispatchPositionEvent: function(position) {
    const event = new CustomEvent('userPositionFound', {
      detail: position
    });
    window.dispatchEvent(event);
  },

  /**
   * 触发位置获取失败事件
   */
  dispatchErrorEvent: function(error) {
    const event = new CustomEvent('userPositionError', {
      detail: error
    });
    window.dispatchEvent(event);
  },

  /**
   * 获取当前用户位置
   */
  getPosition: function() {
    return this.currentPosition;
  },

  /**
   * 计算到指定位置的距离（Haversine 公式）
   * @param {number} lat1 - 起点纬度
   * @param {number} lon1 - 起点经度
   * @param {number} lat2 - 终点纬度
   * @param {number} lon2 - 终点经度
   * @returns {number} 距离（公里）
   */
  calculateDistance: function(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * 角度转弧度
   */
  toRad: function(degrees) {
    return degrees * Math.PI / 180;
  },

  /**
   * 格式化距离显示
   * @param {number} distance - 距离（公里）
   * @returns {string} 格式化的距离字符串
   */
  formatDistance: function(distance) {
    if (distance < 1) {
      return Math.round(distance * 1000) + 'm';
    } else if (distance < 10) {
      return distance.toFixed(1) + 'km';
    } else if (distance < 100) {
      return Math.round(distance) + 'km';
    } else {
      return Math.round(distance) + 'km';
    }
  },

  /**
   * 从用户位置到目标位置的距离
   * @param {number} targetLat - 目标纬度
   * @param {number} targetLon - 目标经度
   * @returns {number|null} 距离（公里），如果用户位置未知则返回 null
   */
  getDistanceFromUser: function(targetLat, targetLon) {
    if (!this.currentPosition) {
      return null;
    }
    return this.calculateDistance(
      this.currentPosition.latitude,
      this.currentPosition.longitude,
      targetLat,
      targetLon
    );
  }
};

// 导出到全局
if (typeof window !== 'undefined') {
  window.GeoLocation = GeoLocation;
}
