// 日志工具 - 修复版
// 修复 export 语法错误

class Logger {
  constructor(prefix = '') {
    this.prefix = `[${prefix}]`;
    this.level = 'info';
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
    }
  }

  /**
   * 调试日志
   */
  debug(...args) {
    if (this.level <= this.levels.debug) {
      console.debug(this.format('DEBUG', ...args));
    }
  }

  /**
   * 信息日志
   */
  info(...args) {
    if (this.level <= this.levels.info) {
      console.log(this.format('INFO', ...args));
    }
  }

  /**
   * 警告日志
   */
  warn(...args) {
    if (this.level <= this.levels.warn) {
      console.warn(this.format('WARN', ...args));
    }
  }

  /**
   * 错误日志
   */
  error(...args) {
    if (this.level <= this.levels.error) {
      console.error(this.format('ERROR', ...args));
    }
  }

  /**
   * 格式化日志
   */
  format(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      } else if (typeof arg === 'function') {
        return '[Function]';
      }
      return String(arg);
    }).join(' ');

    return `${timestamp} ${this.prefix}${level}: ${message}`;
  }

  /**
   * 性能日志
   */
  time(label, fn) {
    const start = performance.now();
    const result = fn();
    const elapsed = performance.now() - start;

    this.debug(`⏱ ${label}: ${elapsed.toFixed(2)}ms`);

    return result;
  }

  /**
   * 创建性能计时器
   */
  createTimer(label) {
    const start = performance.now();
    
    return {
      stop: () => {
        const elapsed = performance.now() - start;
        this.debug(`⏱ ${label}: ${elapsed.toFixed(2)}ms`);
        return elapsed;
      }
    };
  }

  /**
   * 输出对象
   */
  output(obj) {
    console.log(this.format('OUTPUT', JSON.stringify(obj, null, 2)));
  }

  /**
   * 输出表格
   */
  table(headers, rows) {
    console.log(this.format('TABLE', headers.join(' | ')));
    
    rows.forEach(row => {
      console.log(this.format('ROW', row.map(cell => String(cell)).join(' | ')));
    });
  }

  /**
   * 清除控制台
   */
  clear() {
    console.clear();
    this.info('控制台已清空');
  }

  /**
   * 分隔线
   */
  separator() {
    console.log('─'.repeat(50));
  }

  /**
   * 标题
   */
  title(text) {
    this.separator();
    console.log(this.format('TITLE', text));
    this.separator();
  }

  /**
   * 子标题
   */
  subtitle(text) {
    console.log(this.format('SUBTITLE', text));
  }

  /**
   * 成功标记
   */
  success(text) {
    console.log(`✅ ${this.format('SUCCESS', text)}`);
  }

  /**
   * 错误标记
   */
  fail(text) {
    console.log(`❌ ${this.format('FAIL', text)}`);
  }

  /**
   * 警告标记
   */
  alert(text) {
    console.log(`⚠️ ${this.format('ALERT', text)}`);
  }

  /**
   * 信息标记
   */
  infoMark(text) {
    console.log(`ℹ️ ${this.format('INFO', text)}`);
  }
}

// 创建全局实例
const logger = new Logger();

// 导出正确的类
window.Logger = Logger;
window.logger = logger;

console.log('✅ 日志工具已加载');
