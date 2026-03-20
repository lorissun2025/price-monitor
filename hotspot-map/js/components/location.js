/**
 * 定位组件
 * 处理用户位置定位、位置标记、定位按钮等功能
 */

import * as L from 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
import { getUserLocation, isValidLocation, formatDistance } from '../utils/geo.js';

/**
 * 定位组件类
 */
export class LocationComponent {
  /**
   * 构造函数
   * @param {L.Map} map - Leaflet 地图实例
   * @param {Function} onLocationUpdate - 位置更新回调函数
   */
  constructor(map, onLocationUpdate = null) {
    this.map = map;
    this.onLocationUpdate = onLocationUpdate;

    // 用户位置信息
    this.userLocation = {
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      enabled: false
    };

    // 定位状态
    this.isLocating = false;
    this.locationMarker = null;
    this.locationAccuracyCircle = null;

    // 初始化定位按钮
    this.initLocationButton();
  }

  /**
   * 初始化定位按钮
   */
  initLocationButton() {
    // 创建定位按钮容器
    const locationControl = L.control({ position: 'bottomright' });

    locationControl.onAdd = (map) => {
      const container = L.DomUtil.create('div', 'location-control');

      // 创建按钮
      const button = document.createElement('button');
      button.className = 'location-button';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v10m11-11h-6m-6 0H1"></path>
        </svg>
      `;
      button.title = '定位我的位置';
      button.id = 'locationButton';

      // 防止点击按钮时触发地图点击事件
      L.DomEvent.disableClickPropagation(button);

      // 绑定点击事件
      button.addEventListener('click', () => {
        this.handleLocationButtonClick();
      });

      container.appendChild(button);
      return container;
    };

    locationControl.addTo(this.map);
  }

  /**
   * 处理定位按钮点击
   */
  async handleLocationButtonClick() {
    const button = document.getElementById('locationButton');

    // 如果已经定位，点击则移动地图到用户位置
    if (this.userLocation.enabled && !this.isLocating) {
      this.map.setView(
        [this.userLocation.latitude, this.userLocation.longitude],
        this.map.getZoom()
      );
      return;
    }

    // 开始定位
    this.isLocating = true;
    this.updateButtonState('locating');

    try {
      const location = await getUserLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      });

      // 更新用户位置
      this.userLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
        enabled: true
      };

      // 显示位置标记
      this.showLocationMarker(location.latitude, location.longitude, location.accuracy);

      // 移动地图到用户位置
      this.map.setView([location.latitude, location.longitude], 13);

      // 触发位置更新回调
      if (this.onLocationUpdate) {
        this.onLocationUpdate(this.userLocation);
      }

      // 更新按钮状态
      this.updateButtonState('located');

      console.log('定位成功:', this.userLocation);

    } catch (error) {
      console.error('定位失败:', error);
      this.showError(error.message);
      this.updateButtonState('error');
    } finally {
      this.isLocating = false;
    }
  }

  /**
   * 更新按钮状态
   * @param {string} state - 状态（'default', 'locating', 'located', 'error'）
   */
  updateButtonState(state) {
    const button = document.getElementById('locationButton');
    if (!button) return;

    // 移除所有状态类
    button.classList.remove('locating', 'located', 'error');

    // 添加当前状态类
    if (state !== 'default') {
      button.classList.add(state);
    }

    // 更新图标
    if (state === 'locating') {
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32 12"></circle>
        </svg>
      `;
    } else if (state === 'located') {
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
          <path d="M12 1v6m0 6v10m11-11h-6m-6 0H1"></path>
        </svg>
      `;
    } else if (state === 'error') {
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v10m11-11h-6m-6 0H1"></path>
        </svg>
      `;
    } else {
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v10m11-11h-6m-6 0H1"></path>
        </svg>
      `;
    }

    // 更新提示文本
    if (state === 'locating') {
      button.title = '定位中...';
    } else if (state === 'located') {
      button.title = '已定位';
    } else if (state === 'error') {
      button.title = '定位失败，点击重试';
    } else {
      button.title = '定位我的位置';
    }
  }

  /**
   * 显示用户位置标记
   * @param {number} lat - 纬度
   * @param {number} lng - 经度
   * @param {number} accuracy - 精度（米）
   */
  showLocationMarker(lat, lng, accuracy) {
    // 移除旧的位置标记
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }
    if (this.locationAccuracyCircle) {
      this.map.removeLayer(this.locationAccuracyCircle);
    }

    // 创建位置标记
    const locationIcon = L.divIcon({
      className: 'location-marker',
      html: `
        <div class="location-marker-inner">
          <div class="location-dot"></div>
          <div class="location-pulse"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    this.locationMarker = L.marker([lat, lng], {
      icon: locationIcon,
      zIndexOffset: 1000
    }).addTo(this.map);

    // 创建精度圆圈
    this.locationAccuracyCircle = L.circle([lat, lng], {
      radius: accuracy || 100,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      weight: 2,
      zIndexOffset: 999
    }).addTo(this.map);

    // 添加 popup
    this.locationMarker.bindPopup(`
      <div class="location-popup">
        <h4>📍 我的位置</h4>
        <div class="location-info">
          <div>纬度: ${lat.toFixed(6)}</div>
          <div>经度: ${lng.toFixed(6)}</div>
          <div>精度: ${accuracy ? formatDistance(accuracy / 1000) : '未知'}</div>
        </div>
      </div>
    `);
  }

  /**
   * 隐藏位置标记
   */
  hideLocationMarker() {
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
      this.locationMarker = null;
    }
    if (this.locationAccuracyCircle) {
      this.map.removeLayer(this.locationAccuracyCircle);
      this.locationAccuracyCircle = null;
    }
  }

  /**
   * 显示错误提示
   * @param {string} message - 错误消息
   */
  showError(message) {
    // 使用 Toast 显示错误
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 3 秒后移除
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  /**
   * 获取用户位置
   * @returns {Object|null} 用户位置信息
   */
  getUserLocation() {
    if (this.userLocation.enabled) {
      return {
        latitude: this.userLocation.latitude,
        longitude: this.userLocation.longitude,
        accuracy: this.userLocation.accuracy,
        timestamp: this.userLocation.timestamp
      };
    }
    return null;
  }

  /**
   * 检查是否已定位
   * @returns {boolean} 是否已定位
   */
  isLocated() {
    return this.userLocation.enabled &&
           isValidLocation(this.userLocation.latitude, this.userLocation.longitude);
  }

  /**
   * 重置定位状态
   */
  reset() {
    this.userLocation = {
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      enabled: false
    };

    this.hideLocationMarker();
    this.updateButtonState('default');
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.hideLocationMarker();
    const button = document.getElementById('locationButton');
    if (button && button.parentElement) {
      button.parentElement.remove();
    }
  }
}
