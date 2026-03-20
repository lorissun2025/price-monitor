/**
 * 竞品价格监控系统 - 主程序
 * 
 * 功能：
 * 1. 配置管理（加载、验证）
 * 2. 价格监控（单次、定时）
 * 3. 报告生成
 * 4. 命令行接口
 */

import config from './lib/config.js';
import FeishuClient from './lib/feishu-client.js';
import PriceFetcher from './lib/fetcher.js';
import Monitor from './lib/monitor.js';
import Reporter from './lib/reporter.js';
import { existsSync } from 'fs';

/**
 * 主类
 */
class PriceMonitor {
  constructor() {
    this.config = null;
    this.feishuClient = null;
    this.fetcher = null;
    this.monitor = null;
    this.reporter = null;
  }

  /**
   * 初始化
   */
  async init() {
    console.log('🚀 竞品价格监控系统启动...\n');

    // 加载配置
    console.log('📋 正在加载配置...');
    this.config = config;

    // 验证配置
    const isValid = config.validateConfig(this.config);
    if (!isValid) {
      console.log('⚠️  配置验证失败，请检查 config.json');
      console.log('💡 提示：运行 `node index.js add` 添加监控商品');
      process.exit(1);
    }

    console.log(`✅ 配置加载成功，${this.config.products.length} 个商品\n`);

    // 初始化客户端（如果配置了飞书相关功能）
    if (this.config.feishu.app_id && this.config.feishu.app_secret) {
      this.feishuClient = new FeishuClient(this.config.feishu);
      await this.feishuClient.getAccessToken();
    }

    // 初始化抓取器
    this.fetcher = new PriceFetcher(this.config);

    // 初始化监控器
    this.monitor = new Monitor(this.config, this.fetcher);

    // 初始化报告生成器
    this.reporter = new Reporter();

    console.log('✅ 系统初始化完成\n');
  }

  /**
   * 启动监控
   */
  async start() {
    console.log('🚀 启动价格监控...\n');

    try {
      await this.monitor.start();

      console.log('✅ 监控已启动，按 Ctrl+C 停止');
      console.log('💡 提示：运行 `node index.js report` 查看报告\n');
    } catch (error) {
      console.error('❌ 启动监控失败：', error.message);
      throw error;
    }
  }

  /**
   * 停止监控
   */
  async stop() {
    console.log('🛑 停止价格监控...\n');

    try {
      await this.monitor.stop();
      console.log('✅ 监控已停止');
    } catch (error) {
      console.error('❌ 停止监控失败：', error.message);
    }
  }

  /**
   * 检查一次
   */
  async checkOnce() {
    console.log('🔍 执行一次价格检查...\n');

    try {
      const results = await this.monitor.checkOnce();

      if (results && results.length > 0) {
        console.log(`\n✅ 检查完成，成功 ${results.length} 个商品`);
      } else {
        console.log('\n⚠️  没有检查到商品数据');
      }
    } catch (error) {
      console.error('❌ 检查失败：', error.message);
      throw error;
    }
  }

  /**
   * 生成报告
   */
  async generateReport() {
    console.log('📊 生成价格监控报告...\n');

    try {
      // 获取监控结果
      const results = this.monitor.getResults();

      if (!results || results.length === 0) {
        console.log('⚠️  暂无监控数据，无法生成报告');
        console.log('💡 提示：先运行 `node index.js check` 获取数据\n');
        return;
      }

      // 生成报告
      const markdown = this.reporter.generate(results);

      console.log(`\n${markdown}\n`);
      console.log('✅ 报告生成完成\n');
    } catch (error) {
      console.error('❌ 生成报告失败：', error.message);
      throw error;
    }
  }

  /**
   * 添加商品
   */
  async addProduct() {
    console.log('➕ 添加监控商品\n');

    // 示例交互
    const newProduct = {
      id: `p${Date.now()}`,
      name: '示例商品',
      platform: 'jd', // taobao, jd, pdd, amazon
      url: 'https://example.com/item.html',
      targetPrice: 100,
      checkInterval: 3600, // 1小时
      enabled: true,
      notes: '备注信息',
    };

    console.log('示例商品配置：');
    console.log(JSON.stringify(newProduct, null, 2));
    console.log('\n💡 请修改后添加到 config.json 中\n');
  }

  /**
   * 清理
   */
  async cleanup() {
    console.log('🧹 清理资源...\n');

    try {
      if (this.monitor) {
        await this.monitor.stop();
      }

      if (this.fetcher) {
        await this.fetcher.cleanup();
      }

      console.log('✅ 资源清理完成');
    } catch (error) {
      console.error('❌ 清理失败：', error.message);
    }
  }

  /**
   * 优雅退出
   */
  async gracefulExit() {
    console.log('\n👋 收到退出信号，正在清理...\n');

    try {
      await this.cleanup();
      console.log('✅ 清理完成，再见！');
      process.exit(0);
    } catch (error) {
      console.error('❌ 清理失败：', error.message);
      process.exit(1);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const monitor = new PriceMonitor();

  // 初始化
  await monitor.init();

  // 注册退出处理
  process.on('SIGINT', () => monitor.gracefulExit());
  process.on('SIGTERM', () => monitor.gracefulExit());

  // 解析命令行参数
  const action = process.argv[2];

  switch (action) {
    case 'start':
      await monitor.start();
      break;

    case 'stop':
      await monitor.stop();
      break;

    case 'check':
      await monitor.checkOnce();
      break;

    case 'report':
      await monitor.generateReport();
      break;

    case 'add':
      await monitor.addProduct();
      break;

    default:
      console.log(`
📋 竞品价格监控系统 - 使用指南

命令：
  node index.js start    启动监控（定时检查）
  node index.js stop     停止监控
  node index.js check     执行一次检查
  node index.js report    生成报告
  node index.js add      添加商品（显示示例）

示例：
  node index.js check     检查所有商品价格一次
  node index.js report    生成 Markdown 格式的报告

配置文件：config.json
支持平台：taobao, jd, pdd, amazon
      `);
      break;
  }
}

// 运行主函数
main().catch(error => {
  console.error('\n❌ 程序执行失败：', error);
  process.exit(1);
});

export default PriceMonitor;
