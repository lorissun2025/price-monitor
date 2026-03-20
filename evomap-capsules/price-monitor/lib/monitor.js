/**
 * 监控器
 * 
 * 功能：
 * 1. 管理监控任务
 * 2. 定时检查价格
 * 3. 触发提醒
 */

import cron from 'node-cron';
import PriceFetcher from './fetcher.js';

class Monitor {
  constructor(config, fetcher) {
    this.config = config;
    this.fetcher = fetcher;
    this.cronJobs = new Map();
    this.monitorResults = [];
  }

  /**
   * 启动监控
   */
  async start() {
    console.log('\n🚀 启动价格监控...');

    // 初始化抓取器
    await this.fetcher.initBrowser();

    // 为每个商品设置定时任务
    for (const product of this.config.products) {
      if (product.enabled !== false) {
        await this.scheduleProduct(product);
      }
    }

    console.log(`✅ 监控已启动，共 ${this.cronJobs.size} 个定时任务`);
  }

  /**
   * 停止监控
   */
  async stop() {
    console.log('\n⏸ 停止价格监控...');

    // 停止所有定时任务
    for (const [productId, job] of this.cronJobs) {
      if (job) {
        job.stop();
        console.log(`   ✅ 已停止：${productId}`);
      }
    }

    this.cronJobs.clear();

    // 清理资源
    await this.fetcher.cleanup();

    console.log('✅ 监控已停止');
  }

  /**
   * 为商品设置定时任务
   */
  async scheduleProduct(product) {
    console.log(`\n📅 设置定时任务：${product.name}`);
    console.log(`   间隔：${product.checkInterval || this.config.global.checkInterval} 秒`);

    const interval = product.checkInterval || this.config.global.checkInterval;
    const cronExpression = `*/${interval} * * * *`;

    console.log(`   Cron 表达式：${cronExpression}`);

    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.checkProduct(product);
      } catch (error) {
        console.error(`❌ 检查商品 ${product.name} 失败：`, error.message);
      }
    }, {
      scheduled: false,
    });

    this.cronJobs.set(product.id, job);
    console.log(`   ✅ 定时任务已设置`);
  }

  /**
   * 检查单个商品
   */
  async checkProduct(product) {
    console.log(`\n🔍 检查商品：${product.name}`);

    try {
      // 抓取价格
      const result = await this.fetcher.fetchPrice(product);

      if (!result) {
        console.log(`   ⚠️  抓取失败，跳过分析`);
        return;
      }

      // 获取价格历史
      const history = this.fetcher.getPriceHistory(product.id);
      result.priceHistory = history;

      // 分析价格
      const analysis = this.analyzePrice(result, product);

      // 判断是否需要提醒
      if (this.shouldNotify(result, analysis)) {
        await this.sendNotification(result, analysis);
      }

      // 保存结果
      this.monitorResults.push({
        ...result,
        analysis,
      });

      console.log(`   ✅ 检查完成：当前价格 ¥${result.price}`);
      if (analysis.dropPercent) {
        console.log(`   📉 降价：${analysis.dropPercent.toFixed(2)}%`);
      }
    } catch (error) {
      console.error(`   ❌ 检查失败：`, error.message);
    }
  }

  /**
   * 分析价格
   */
  analyzePrice(result, product) {
    const history = result.priceHistory || [];
    const currentPrice = result.price;

    const analysis = {
      currentPrice: currentPrice,
      previousPrice: null,
      dropPercent: null,
      risePercent: null,
      isDrop: false,
      isBelowTarget: currentPrice < (product.targetPrice || Infinity),
      highPrice: currentPrice,
      lowPrice: currentPrice,
      avgPrice: currentPrice,
      dropCount: 0,
      priceRange: 0,
    };

    if (history.length > 0) {
      // 上次价格
      const previous = history[history.length - 1].price;
      analysis.previousPrice = previous;

      // 降价幅度
      if (previous > 0 && previous !== currentPrice) {
        const drop = (previous - currentPrice) / previous;
        if (drop > 0) {
          analysis.dropPercent = drop * 100;
          analysis.isDrop = true;
        } else {
          analysis.risePercent = Math.abs(drop) * 100;
        }
      }

      // 统计价格
      const prices = history.map(h => h.price);
      analysis.highPrice = Math.max(...prices, currentPrice);
      analysis.lowPrice = Math.min(...prices, currentPrice);
      analysis.avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      analysis.priceRange = analysis.highPrice - analysis.lowPrice;

      // 统计降价次数
      for (let i = 1; i < history.length; i++) {
        if (history[i - 1].price > history[i].price) {
          analysis.dropCount++;
        }
      }
    }

    return analysis;
  }

  /**
   * 判断是否需要提醒
   */
  shouldNotify(result, analysis) {
    const notification = this.config.notification;

    // 降价提醒
    if (notification.onDrop && analysis.isDrop) {
      const dropThreshold = notification.dropThreshold || 0.05;
      if (analysis.dropPercent >= dropThreshold * 100) {
        return true;
      }
    }

    // 低于目标价提醒
    if (notification.onBelowTarget && analysis.isBelowTarget) {
      return true;
    }

    return false;
  }

  /**
   * 发送提醒
   */
  async sendNotification(result, analysis) {
    console.log('\n🔔 发送提醒：');
    console.log(`   商品：${result.productName}`);
    console.log(`   当前价格：¥${result.price}`);
    console.log(`   上次价格：¥${analysis.previousPrice || '未知'}`);

    if (analysis.isDrop) {
      console.log(`   📉 降价：${analysis.dropPercent.toFixed(2)}%`);
      console.log(`   💰 节省：¥${(analysis.previousPrice - result.price).toFixed(2)}`);
    }

    if (analysis.isBelowTarget) {
      console.log(`   🎯 已低于目标价：¥${this.config.products.find(p => p.id === result.productId)?.targetPrice}`);
    }

    // TODO: 这里可以扩展其他提醒方式（邮件、微信、飞书等）
  }

  /**
   * 手动检查一次
   */
  async checkOnce() {
    console.log('\n🔍 手动检查一次...\n');

    await this.fetcher.fetchPrices(this.config.products);

    console.log('\n✅ 检查完成');
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📊 生成报告...\n');

    const report = {
      generatedAt: new Date().toISOString(),
      totalProducts: this.config.products.length,
      enabledProducts: this.config.products.filter(p => p.enabled !== false).length,
      results: this.monitorResults,
    };

    return report;
  }

  /**
   * 获取监控结果
   */
  getResults() {
    return this.monitorResults;
  }
}

export default Monitor;
