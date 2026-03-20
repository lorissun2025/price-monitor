/**
 * 价格抓取器
 * 
 * 功能：
 * 1. 支持多个平台：淘宝、京东、拼多多、亚马逊
 * 2. 使用 Puppeteer 进行真实浏览器抓取
 * 3. 支持反爬策略
 */

import puppeteer from 'puppeteer';

class PriceFetcher {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.priceHistory = new Map(); // 存储价格历史
  }

  /**
   * 初始化浏览器
   */
  async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    console.log('🌐 正在启动浏览器...');

    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    console.log('✅ 浏览器启动成功');
    return this.browser;
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ 浏览器已关闭');
    }
  }

  /**
   * 抓取价格（统一接口）
   */
  async fetchPrice(product) {
    console.log(`\n💰 正在抓取价格：${product.name}`);

    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // 设置 User-Agent
      await page.setUserAgent(this.config.global.userAgent);

      // 设置视口
      await page.setViewport({ width: 1920, height: 1080 });

      // 超时控制
      page.setDefaultTimeout(this.config.global.requestTimeout);

      let price = null;

      // 根据平台选择抓取方法
      switch (product.platform) {
        case 'taobao':
          price = await this.fetchTaobao(page, product);
          break;
        case 'jd':
          price = await this.fetchJD(page, product);
          break;
        case 'pdd':
          price = await this.fetchPDD(page, product);
          break;
        case 'amazon':
          price = await this.fetchAmazon(page, product);
          break;
        default:
          throw new Error(`不支持的平台：${product.platform}`);
      }

      // 更新价格历史
      this.updatePriceHistory(product.id, price);

      console.log(`✅ 抓取成功：¥${price}`);

      return {
        productId: product.id,
        productName: product.name,
        price: price,
        platform: product.platform,
        url: product.url,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`❌ 抓取失败：${error.message}`);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * 抓取淘宝价格
   */
  async fetchTaobao(page, product) {
    console.log('   🛍️ 抓取淘宝...');

    await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 10000 });

    // 等待价格元素加载
    await page.waitForSelector('.Price .Price-normal, .tm-price, [data-sku-id]', { timeout: 5000 }).catch(() => {});

    // 提取价格
    const price = await page.evaluate(() => {
      // 方法 1：tm-price
      let priceText = document.querySelector('.tm-price')?.textContent;
      if (priceText) {
        return priceText.replace(/[^\d.]/g, '');
      }

      // 方法 2：Price-normal
      priceText = document.querySelector('.Price .Price-normal')?.textContent;
      if (priceText) {
        return priceText.replace(/[^\d.]/g, '');
      }

      // 方法 3：price
      priceText = document.querySelector('[data-sku-id]')?.textContent;
      if (priceText) {
        return priceText.replace(/[^\d.]/g, '');
      }

      // 方法 4：尝试其他常见选择器
      const selectors = [
        '.price .num',
        '.price .symbol',
        '.tb-rmb-num',
        '#price',
        '[class*="price"]',
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent.replace(/[^\d.]/g, '');
        }
      }

      throw new Error('无法找到价格元素');
    });

    if (!price) {
      throw new Error('未能提取价格');
    }

    return parseFloat(price);
  }

  /**
   * 抓取京东价格
   */
  async fetchJD(page, product) {
    console.log('   🐕 抓取京东...');

    await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 10000 });

    // 等待价格元素加载
    await page.waitForSelector('.price .p-price, .price .p-price .price, #price', { timeout: 5000 }).catch(() => {});

    const price = await page.evaluate(() => {
      // 方法 1：p-price
      let priceText = document.querySelector('.price .p-price')?.textContent;
      if (priceText) {
        return priceText.replace(/[^\d.]/g, '');
      }

      // 方法 2：price
      priceText = document.querySelector('#price')?.textContent;
      if (priceText) {
        return priceText.replace(/[^\d.]/g, '');
      }

      // 方法 3：尝试其他选择器
      const selectors = [
        '.price .num',
        '.jd-price',
        '[class*="price"]',
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent.replace(/[^\d.]/g, '');
        }
      }

      throw new Error('无法找到价格元素');
    });

    if (!price) {
      throw new Error('未能提取价格');
    }

    return parseFloat(price);
  }

  /**
   * 抓取拼多多价格
   */
  async fetchPDD(page, product) {
    console.log('   🍑 抓取拼多多...');

    await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 10000 });

    // 等待价格元素加载
    await page.waitForSelector('.goods-price, [class*="price"]', { timeout: 5000 }).catch(() => {});

    const price = await page.evaluate(() => {
      // 拼多多价格选择器
      const selectors = [
        '.goods-price',
        '.price-current',
        '[class*="price"]',
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent.replace(/[^\d.]/g, '');
        }
      }

      throw new Error('无法找到价格元素');
    });

    if (!price) {
      throw new Error('未能提取价格');
    }

    return parseFloat(price);
  }

  /**
   * 抓取亚马逊价格
   */
  async fetchAmazon(page, product) {
    console.log('   📦 抓取亚马逊...');

    await page.goto(product.url, { waitUntil: 'networkidle2', timeout: 15000 });

    // 等待价格元素加载
    await page.waitForSelector('.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice', { timeout: 5000 }).catch(() => {});

    const price = await page.evaluate(() => {
      // 亚马逊价格选择器
      const selectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#price_inside_buybox',
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent;
          // 提取数字
          const match = text.match(/[\d,.]+/);
          if (match) {
            return match[0].replace(/,/g, '');
          }
        }
      }

      throw new Error('无法找到价格元素');
    });

    if (!price) {
      throw new Error('未能提取价格');
    }

    return parseFloat(price);
  }

  /**
   * 更新价格历史
   */
  updatePriceHistory(productId, price) {
    if (!this.priceHistory.has(productId)) {
      this.priceHistory.set(productId, []);
    }

    const history = this.priceHistory.get(productId);
    history.push({
      price: price,
      timestamp: Date.now(),
    });

    // 只保留最近 100 条记录
    if (history.length > 100) {
      history.shift();
    }

    this.priceHistory.set(productId, history);
  }

  /**
   * 获取价格历史
   */
  getPriceHistory(productId) {
    return this.priceHistory.get(productId) || [];
  }

  /**
   * 批量抓取（支持并发）
   */
  async fetchPrices(products) {
    console.log(`\n💰 开始批量抓取 ${products.length} 个商品...`);

    const enabledProducts = products.filter(p => p.enabled !== false);
    console.log(`   其中 ${enabledProducts.length} 个已启用`);

    const maxConcurrent = this.config.global.maxConcurrent || 3;
    const results = [];

    // 分批处理
    for (let i = 0; i < enabledProducts.length; i += maxConcurrent) {
      const batch = enabledProducts.slice(i, i + maxConcurrent);
      console.log(`\n   处理批次 ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(enabledProducts.length / maxConcurrent)}`);

      const batchResults = await Promise.allSettled(
        batch.map(product => 
          this.fetchPrice(product).catch(error => {
            console.error(`   ❌ ${product.name} 抓取失败：`, error.message);
            return null;
          })
        )
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });

      // 批次间延迟，避免被封
      if (i + maxConcurrent < enabledProducts.length) {
        console.log('   ⏱️  等待 5 秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`\n✅ 批量抓取完成，成功 ${results.length} 个`);
    return results;
  }

  /**
   * 清理资源
   */
  async cleanup() {
    await this.closeBrowser();
    this.priceHistory.clear();
    console.log('✅ 资源已清理');
  }
}

export default PriceFetcher;
