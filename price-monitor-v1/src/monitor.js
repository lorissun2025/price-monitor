// monitor.js - 监控逻辑
const { loadProducts, addPriceRecord } = require('./storage');
const jd = require('./api/jd');
const taobao = require('./api/taobao');
const pdd = require('./api/pdd');
const amazon = require('./api/amazon');

const fetchers = { jd, taobao, pdd, amazon };

async function fetchProductPrice(product) {
  const fetcher = fetchers[product.platform];
  if (!fetcher) throw new Error(`Unknown platform: ${product.platform}`);
  return fetcher.fetchPrice(product.id.replace(product.platform + '_', ''));
}

async function checkAll() {
  const products = loadProducts().filter(p => p.monitor);
  const results = [];
  for (const product of products) {
    try {
      const data = await fetchProductPrice(product);
      addPriceRecord(product.id, product.platform, data.price);
      results.push({ ...data, productId: product.id, targetPrice: product.targetPrice, alert: data.price <= product.targetPrice });
    } catch (err) {
      results.push({ error: err.message, productId: product.id });
    }
  }
  return results;
}

module.exports = { fetchProductPrice, checkAll };
