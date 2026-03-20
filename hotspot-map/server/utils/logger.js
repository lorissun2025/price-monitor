/**
 * 后端日志工具
 * 支持日志级别：error, warn, info, debug
 */

const fs = require('fs');
const path = require('path');

const Logger = {
  // 日志级别配置
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },

  // 当前日志级别
  currentLevel: null,

  // 日志文件路径
  logFilePath: null,

  /**
   * 初始化日志系统
   */
  init() {
    // 设置日志级别
    const envLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'WARN' : 'DEBUG');
    this.currentLevel = this.levels[envLevel.toUpperCase()] || this.levels.INFO;

    // 设置日志文件路径
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, `app-${this.getDateString()}.log`);

    this.info('🗺️ 日志系统初始化完成', {
      level: this.getLevelName(this.currentLevel),
      env: process.env.NODE_ENV || 'development',
      logFile: this.logFilePath
    });
  },

  /**
   * 获取日期字符串（用于日志文件名）
   */
  getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  },

  /**
   * 获取时间戳（用于日志内容）
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString();
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
   * 格式化日志消息
   */
  formatMessage(level, message, data) {
    const timestamp = this.getTimestamp();
    const levelName = this.getLevelName(level);
    let logMessage = `[${timestamp}] [${levelName}] ${message}`;

    if (data) {
      if (typeof data === 'object') {
        logMessage += ' ' + JSON.stringify(data);
      } else {
        logMessage += ' ' + String(data);
      }
    }

    return logMessage;
  },

  /**
   * 写入日志到文件
   */
  writeToFile(message) {
    try {
      if (this.logFilePath) {
        fs.appendFileSync(this.logFilePath, message + '\n');
      }
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  },

  /**
   * 输出日志
   */
  log(level, message, data = null) {
    if (!this.shouldLog(level)) return;

    const logMessage = this.formatMessage(level, message, data);

    // 输出到控制台
    switch (level) {
      case this.levels.ERROR:
        console.error(logMessage);
        break;
      case this.levels.WARN:
        console.warn(logMessage);
        break;
      case this.levels.INFO:
        console.log(logMessage);
        break;
      case this.levels.DEBUG:
        console.log(logMessage);
        break;
    }

    // 写入日志文件
    this.writeToFile(logMessage);
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
   * 请求日志
   */
  request(method, path, statusCode, elapsed) {
    const emoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';
    this.info(`${emoji} ${method} ${path} ${statusCode}`, { elapsed: `${elapsed}ms` });
  },

  /**
   * 设置日志级别
   */
  setLevel(level) {
    const upperLevel = level.toUpperCase();
    if (this.levels[upperLevel] !== undefined) {
      this.currentLevel = this.levels[upperLevel];
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

module.exports = Logger;
