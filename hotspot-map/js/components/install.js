// 安装提示组件
// 负责 PWA 安装引导和横幅提示

class InstallPrompt {
  constructor() {
    this.prompt = null;
    this.deferredPrompt = null;
    this.isInstalled = false;
  }

  /**
   * 初始化
   */
  async init() {
    console.log('[Install] 初始化安装提示...');

    // 检查是否已安装
    this.isInstalled = this.checkInstalled();

    if (this.isInstalled) {
      console.log('[Install] 已安装，无需提示');
      return;
    }

    // 监听 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[Install] 检测到安装提示');
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // 监听 appinstalled 事件
    window.addEventListener('appinstalled', () => {
      console.log('[Install] 应用已安装');
      this.isInstalled = true;
      this.hideInstallBanner();
    });

    // 显示安装横幅
    if (!this.isInstalled) {
      this.showInstallBanner();
    }
  }

  /**
   * 检查是否已安装
   */
  checkInstalled() {
    // 检查 display-mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // 检查是否从主屏幕启动
    const isInStandaloneMode = window.navigator.standalone;

    return isStandalone || isInStandaloneMode;
  }

  /**
   * 显示安装横幅
   */
  showInstallBanner() {
    // 创建或获取横幅
    let banner = document.getElementById('install-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'install-banner';
      banner.className = 'install-banner';
      banner.innerHTML = `
        <div class="install-banner-content">
          <div class="install-banner-icon">📱</div>
          <div class="install-banner-text">
            <div class="install-banner-title">安装应用到主屏幕</div>
            <div class="install-banner-desc">点击安装，离线使用更方便</div>
          </div>
          <button class="install-banner-button" id="install-btn">安装</button>
        </div>
        <button class="install-banner-close" id="close-banner">✕</button>
      </div>
      `;

      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .install-banner {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 16px;
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        .install-banner:hover {
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .install-banner-icon {
          font-size: 32px;
        }

        .install-banner-text {
          flex: 1;
        }

        .install-banner-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .install-banner-desc {
          font-size: 14px;
          opacity: 0.9;
        }

        .install-banner-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .install-banner-button:hover {
          background: #f0f0f0;
          transform: scale(1.05);
        }

        .install-banner-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .install-banner-close:hover {
          background: rgba(255,255,255,0.3);
        }
      `;
      document.head.appendChild(style);
    }

    // 插入到页面
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.insertBefore(banner, appContainer.firstChild);
    }

    this.prompt = banner;

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const installBtn = document.getElementById('install-btn');
    const closeBtn = document.getElementById('close-banner');

    if (installBtn) {
      installBtn.addEventListener('click', () => this.promptInstall());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideInstallBanner());
    }
  }

  /**
   * 提示安装
   */
  promptInstall() {
    if (!this.deferredPrompt) {
      console.warn('[Install] 没有可用的安装提示');
      return;
    }

    console.log('[Install] 提示安装...');
    this.deferredPrompt.prompt();

    this.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[Install] 用户接受了安装');
        this.hideInstallBanner();
      } else {
        console.log('[Install] 用户拒绝了安装');
      }
    });

    this.deferredPrompt = null;
  }

  /**
   * 隐藏安装横幅
   */
  hideInstallBanner() {
    if (this.prompt) {
      // 添加淡出动画
      this.prompt.style.transition = 'opacity 0.5s, transform 0.5s';
      this.prompt.style.opacity = '0';
      this.prompt.style.transform = 'translateX(-50%) translateY(100%)';

      // 移除横幅
      setTimeout(() => {
        if (this.prompt && this.prompt.parentNode) {
          this.prompt.parentNode.removeChild(this.prompt);
        }
        this.prompt = null;
      }, 500);
    }
  }

  /**
   * 显示 iOS 安装说明
   */
  showIOSInstructions() {
    const modal = document.createElement('div');
    modal.className = 'ios-install-modal';
    modal.innerHTML = `
      <div class="ios-modal-content">
        <div class="ios-modal-header">
          <h2>安装到主屏幕</h2>
          <button class="ios-modal-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="ios-modal-body">
          <div class="ios-step">
            <div class="ios-step-number">1</div>
            <div class="ios-step-content">
              <div class="ios-step-icon">📱</div>
              <div class="ios-step-text">点击分享按钮</div>
              <div class="ios-step-arrow">↓</div>
            </div>
          </div>
          <div class="ios-step">
            <div class="ios-step-number">2</div>
            <div class="ios-step-content">
              <div class="ios-step-icon">📋</div>
              <div class="ios-step-text">找到"添加到主屏幕"</div>
              <div class="ios-step-arrow">↓</div>
            </div>
          </div>
          <div class="ios-step">
            <div class="ios-step-number">3</div>
            <div class="ios-step-content">
              <div class="ios-step-icon">📍</div>
              <div class="ios-step-text">点击添加</div>
              <div class="ios-step-arrow">↓</div>
            </div>
          </div>
          <div class="ios-step">
            <div class="ios-step-number">4</div>
            <div class="ios-step-content">
              <div class="ios-step-icon">🎉</div>
              <div class="ios-step-text">完成！</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .ios-install-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .ios-modal-content {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }

      .ios-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        border-bottom: 1px solid #eee;
        padding-bottom: 16px;
      }

      .ios-modal-header h2 {
        margin: 0;
        color: #333;
        font-size: 20px;
      }

      .ios-modal-close {
        background: #f5f5f5;
        border: none;
        color: #999;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .ios-modal-close:hover {
        background: #e0e0e0;
        color: #666;
      }

      .ios-modal-body {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .ios-step {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .ios-step-number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #667eea;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .ios-step-content {
        flex: 1;
      }

      .ios-step-icon {
        font-size: 24px;
        margin-right: 8px;
      }

      .ios-step-text {
        color: #666;
        font-size: 14px;
      }

      .ios-step-arrow {
        color: #999;
        font-size: 20px;
      }

      .ios-step:last-child .ios-step-arrow {
        display: none;
      }

      .ios-step:last-child .ios-step-text {
        color: #667eea;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    // 插入到页面
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// 导出到全局
window.InstallPrompt = InstallPrompt;

console.log('✅ 安装提示组件已加载');
