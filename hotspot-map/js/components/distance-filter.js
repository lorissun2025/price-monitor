/**
 * 距离筛选组件
 * 提供按距离筛选热点的功能
 */

/**
 * 距离筛选组件类
 */
export class DistanceFilter {
  /**
   * 构造函数
   * @param {HTMLElement} container - 容器元素
   * @param {Function} onFilterChange - 筛选变化回调函数
   */
  constructor(container, onFilterChange = null) {
    this.container = container;
    this.onFilterChange = onFilterChange;

    // 当前筛选状态
    this.currentDistance = null; // null 表示不限制

    // 初始化 UI
    this.initUI();
  }

  /**
   * 初始化 UI
   */
  initUI() {
    // 创建距离筛选器容器
    const filterContainer = document.createElement('div');
    filterContainer.className = 'distance-filter';
    filterContainer.innerHTML = `
      <h3>📍 距离筛选</h3>
      <div class="distance-filter-group">
        <button class="distance-filter-btn active" data-distance="null">全部</button>
        <button class="distance-filter-btn" data-distance="1">1km</button>
        <button class="distance-filter-btn" data-distance="5">5km</button>
        <button class="distance-filter-btn" data-distance="10">10km</button>
        <button class="distance-filter-btn" data-distance="50">50km</button>
      </div>
    `;

    // 添加到容器
    this.container.appendChild(filterContainer);

    // 绑定按钮点击事件
    filterContainer.querySelectorAll('.distance-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleButtonClick(e.target);
      });
    });
  }

  /**
   * 处理按钮点击
   * @param {HTMLElement} button - 被点击的按钮
   */
  handleButtonClick(button) {
    // 移除所有按钮的 active 类
    this.container.querySelectorAll('.distance-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // 添加当前按钮的 active 类
    button.classList.add('active');

    // 获取距离值
    const distanceValue = button.getAttribute('data-distance');
    this.currentDistance = distanceValue === 'null' ? null : parseFloat(distanceValue);

    // 触发筛选变化回调
    if (this.onFilterChange) {
      this.onFilterChange(this.currentDistance);
    }
  }

  /**
   * 获取当前筛选距离
   * @returns {number|null} 当前筛选距离（km），null 表示不限制
   */
  getCurrentDistance() {
    return this.currentDistance;
  }

  /**
   * 设置筛选距离
   * @param {number|null} distance - 距离（km），null 表示不限制
   */
  setDistance(distance) {
    this.currentDistance = distance;

    // 更新 UI
    const buttons = this.container.querySelectorAll('.distance-filter-btn');
    buttons.forEach(btn => {
      const btnDistance = btn.getAttribute('data-distance');
      const btnValue = btnDistance === 'null' ? null : parseFloat(btnDistance);

      if ((distance === null && btnValue === null) || distance === btnValue) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 触发筛选变化回调
    if (this.onFilterChange) {
      this.onFilterChange(this.currentDistance);
    }
  }

  /**
   * 重置筛选
   */
  reset() {
    this.setDistance(null);
  }

  /**
   * 禁用筛选器
   */
  disable() {
    this.container.querySelectorAll('.distance-filter-btn').forEach(btn => {
      btn.disabled = true;
      btn.classList.add('disabled');
    });
  }

  /**
   * 启用筛选器
   */
  enable() {
    this.container.querySelectorAll('.distance-filter-btn').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('disabled');
    });
  }

  /**
   * 销毁组件
   */
  destroy() {
    const filterContainer = this.container.querySelector('.distance-filter');
    if (filterContainer) {
      filterContainer.remove();
    }
  }
}
