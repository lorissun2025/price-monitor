/**
 * 前端日志工具
 * 支持日志级别：error, warn, info, debug
 */

const Logger = {
  // 日志级别配置
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },

  // 当前日志级别（可通过环境变量或 localStorage 配置）
  currentLevel: null,

  /**
   * 初始化日志级别
   */
  init() {
    // 优先级：localStorage > 环境变量 > 默认值
    const storedLevel = localStorage.getItem('logLevel');

    if (storedLevel) {
      this.currentLevel = this.levels[storedLevel.toUpperCase()] || this.levels.INFO;
    } else if (process?.env?.NODE_ENV === 'production') {
      this.currentLevel = this.levels.WARN; // 生产环境只输出 warn 和 error
    } else {
      this.currentLevel = this.levels.DEBUG; // 开发环境输出所有日志
    }

    this.info('🗺️ 日志系统初始化完成', { level: this.getLevelName(this.currentLevel) });
  },

  /**
   * 获取日志级别名称
   */
  getLevelName(level) {
    return Object.keys(this.levels).find(key => this.levels[key] === level);
  },

  /**
   * 检查是否应该输出日志
   */
  shouldLog(level) {
    return this.currentLevel !== null && level <= this.currentLevel;
  },

  /**
   * 格式化时间戳
   */
  getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' +
           String(now.getMilliseconds()).padStart(3, '0');
  },

  /**
   * 输出日志
   */
  log(level, message, data = null) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.getTimestamp();
    const levelName = this.getLevelName(level);
    const prefix = `[${timestamp}] [${levelName}]`;

    switch (level) {
      case this.levels.ERROR:
        console.error(prefix, message, data || '');
        break;
      case this.levels.WARN:
        console.warn(prefix, message, data || '');
        break;
      case this.levels.INFO:
        console.log(prefix, message, data || '');
        break;
      case this.levels.DEBUG:
        console.log(prefix, message, data || '');
        break;
    }
  },

  /**
   * 错误日志
   */
  error(message, error = null) {
    const data = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    this.log(this.levels.ERROR, message, data);
  },

  /**
   * 警告日志
   */
  warn(message, data = null) {
    this.log(this.levels.WARN, message, data);
  },

  /**
   * 信息日志
   */
  info(message, data = null) {
    this.log(this.levels.INFO, message, data);
  },

  /**
   * 调试日志
   */
  debug(message, data = null) {
    this.log(this.levels.DEBUG, message, data);
  },

  /**
   * 性能日志
   */
  performance(label, elapsed, data = null) {
    const info = { elapsed: `${elapsed}ms` };
    if (data) Object.assign(info, data);
    this.info(`⏱️ ${label}`, info);
  },

  /**
   * 设置日志级别
   */
  setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (this.levels[upperLevel] !== undefined) {
      this.currentLevel = this.levels[upperLevel];
      localStorage.setItem('logLevel', upperLevel);
      this.info('日志级别已更新', { level: upperLevel });
    } else {
      console.error('无效的日志级别:', level);
    }
  },

  /**
   * 获取当前日志级别
   */
  getLevel() {
    return this.getLevelName(this.currentLevel);
  }
};

// 初始化日志系统
Logger.init();

// 导出全局使用
window.Logger = Logger;

export default Logger;
