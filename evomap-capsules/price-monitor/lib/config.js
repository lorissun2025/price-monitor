/**
 * 配置模块
 */

import { readFileSync, existsSync } from 'fs';

/**
 * 默认配置
 */
const defaultConfig = {
  // 监控的商品列表
  products: [],

  // 全局配置
  global: {
    maxConcurrent: 3, // 最大并发数
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    retryTimes: 3, // 失败重试次数
    retryDelay: 5000, // 重试延迟（毫秒）
    requestTimeout: 10000, // 请求超时时间（毫秒）
    checkInterval: 3600, // 默认检查间隔（1小时）
  },

  // 提醒配置
  notification: {
    onDrop: true, // 降价提醒
    onBelowTarget: true, // 低于目标价提醒
    dropThreshold: 0.05, // 降价阈值（5%）
  },

  // 输出配置
  output: {
    logFile: 'price-monitor.log',
    dataFile: 'price-data.json',
    reportFile: 'price-report.md',
  },
};

/**
 * 加载配置文件
 */
function loadConfig(configPath = 'config.json') {
  try {
    if (!existsSync(configPath)) {
      console.log('⚠️  配置文件不存在，使用默认配置');
      return defaultConfig;
    }

    const configData = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // 合并默认配置
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      global: {
        ...defaultConfig.global,
        ...config.global,
      },
      notification: {
        ...defaultConfig.notification,
        ...config.notification,
      },
      output: {
        ...defaultConfig.output,
        ...config.output,
      },
    };

    console.log('✅ 配置加载成功');
    console.log(`   监控商品：${mergedConfig.products.length} 个`);
    return mergedConfig;
  } catch (error) {
    console.error('❌ 加载配置失败：', error.message);
    return defaultConfig;
  }
}

/**
 * 创建示例配置文件
 */
function createExampleConfig() {
  const exampleConfig = {
    products: [
      {
        id: 'p001',
        name: 'iPhone 15 Pro',
        platform: 'jd',
        url: 'https://item.jd.com/123456.html',
        targetPrice: 6999,
        checkInterval: 3600,
        enabled: true,
        notes: '256GB 蓝色',
      },
      {
        id: 'p002',
        name: 'MacBook Pro 14',
        platform: 'taobao',
        url: 'https://item.taobao.com/item.htm?id=789012',
        targetPrice: 12999,
        checkInterval: 3600,
        enabled: true,
        notes: 'M3 Pro 512GB',
      },
    ],
    global: {
      maxConcurrent: 3,
      checkInterval: 3600,
    },
  };

  return exampleConfig;
}

/**
 * 验证配置
 */
function validateConfig(config) {
  const errors = [];

  // 验证商品配置
  if (!config.products || !Array.isArray(config.products)) {
    errors.push('products 必须是数组');
  } else {
    config.products.forEach((product, index) => {
      if (!product.id) errors.push(`商品 ${index} 缺少 id`);
      if (!product.name) errors.push(`商品 ${index} 缺少 name`);
      if (!product.platform) errors.push(`商品 ${index} 缺少 platform`);
      if (!product.url) errors.push(`商品 ${index} 缺少 url`);
      if (!product.targetPrice || product.targetPrice <= 0) {
        errors.push(`商品 ${index} 的 targetPrice 必须大于 0`);
      }
    });
  }

  // 验证平台
  const validPlatforms = ['taobao', 'jd', 'pdd', 'amazon'];
  config.products.forEach(product => {
    if (!validPlatforms.includes(product.platform)) {
      errors.push(`商品 ${product.id} 的平台 ${product.platform} 不支持`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ 配置验证失败：');
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }

  console.log('✅ 配置验证通过');
  return true;
}

export default {
  defaultConfig,
  loadConfig,
  createExampleConfig,
  validateConfig,
};
