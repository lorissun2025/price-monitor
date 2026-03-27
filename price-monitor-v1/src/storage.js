// storage.js - JSON 文件存储模块 v0.3
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- 商品管理 ---
function loadProducts() {
  ensureDir();
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const defaults = getDefaultProducts();
    saveProducts(defaults);
    return defaults;
  }
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
}

function saveProducts(products) {
  ensureDir();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function addProduct(product) {
  const products = loadProducts();
  product.id = product.platform + '_' + Date.now();
  product.createdAt = new Date().toISOString();
  product.monitor = true;
  product.alertPercent = null; // 降价幅度提醒
  products.push(product);
  saveProducts(products);
  return product;
}

function updateProduct(id, updates) {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates, id };
  saveProducts(products);
  return products[idx];
}

function deleteProduct(id) {
  let products = loadProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  const prices = loadPrices();
  delete prices[id];
  savePrices(prices);
  return true;
}

function searchProducts(keyword) {
  const products = loadProducts();
  if (!keyword) return products;
  const kw = keyword.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(kw) ||
    p.platform.toLowerCase().includes(kw) ||
    (p.url && p.url.toLowerCase().includes(kw))
  );
}

// --- 价格记录 ---
function loadPrices() {
  ensureDir();
  if (!fs.existsSync(PRICES_FILE)) return {};
  return JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
}

function savePrices(prices) {
  ensureDir();
  fs.writeFileSync(PRICES_FILE, JSON.stringify(prices, null, 2), 'utf8');
}

function addPriceRecord(productId, platform, price) {
  const prices = loadPrices();
  if (!prices[productId]) prices[productId] = [];
  const today = new Date().toISOString().slice(0, 10);
  prices[productId].push({ price, time: new Date().toISOString(), platform, date: today });
  if (prices[productId].length > 500) prices[productId] = prices[productId].slice(-500);
  savePrices(prices);
}

// --- 提醒历史 ---
function loadAlerts() {
  ensureDir();
  if (!fs.existsSync(ALERTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
}

function saveAlerts(alerts) {
  ensureDir();
  // 只保留最近200条
  const trimmed = alerts.slice(-200);
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

function addAlert(alert) {
  const alerts = loadAlerts();
  alert.time = new Date().toISOString();
  alert.id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  alerts.push(alert);
  saveAlerts(alerts);
  return alert;
}

// --- 示例数据 ---
function getDefaultProducts() {
  return [
    { id: 'jd_001', name: 'Apple iPhone 16 Pro Max 256GB', platform: 'jd', url: 'https://item.jd.com/100123456.html', targetPrice: 8999, monitor: true, alertPercent: 5, createdAt: '2026-03-20T10:00:00.000Z' },
    { id: 'taobao_002', name: '索尼 WH-1000XM5 降噪耳机', platform: 'taobao', url: 'https://item.taobao.com/item.htm?id=654321', targetPrice: 1999, monitor: true, alertPercent: null, createdAt: '2026-03-21T08:00:00.000Z' },
    { id: 'jd_003', name: 'MacBook Air M3 15英寸 16GB+512GB', platform: 'jd', url: 'https://item.jd.com/100789012.html', targetPrice: 9999, monitor: true, alertPercent: 3, createdAt: '2026-03-22T09:00:00.000Z' },
    { id: 'pdd_004', name: '戴森 V15 Detect 无绳吸尘器', platform: 'pdd', url: 'https://mobile.yangkeduo.com/goods.html?goods_id=123456', targetPrice: 3299, monitor: true, alertPercent: null, createdAt: '2026-03-23T11:00:00.000Z' },
    { id: 'taobao_005', name: 'iPad Air M2 11英寸 256GB', platform: 'taobao', url: 'https://item.taobao.com/item.htm?id=987654', targetPrice: 4299, monitor: false, alertPercent: null, createdAt: '2026-03-24T14:00:00.000Z' },
    { id: 'jd_006', name: '华为 Mate 70 Pro 512GB', platform: 'jd', url: 'https://item.jd.com/100456789.html', targetPrice: 5999, monitor: true, alertPercent: 10, createdAt: '2026-03-25T10:00:00.000Z' },
  ];
}

function initSamplePrices() {
  const prices = loadPrices();
  if (Object.keys(prices).length > 0) return;
  const basePrices = {
    'jd_001': { base: 9499, range: 500 },
    'taobao_002': { base: 2299, range: 300 },
    'jd_003': { base: 10999, range: 800 },
    'pdd_004': { base: 3699, range: 400 },
    'taobao_005': { base: 4599, range: 300 },
    'jd_006': { base: 6499, range: 500 },
  };
  const now = Date.now();
  for (const [id, config] of Object.entries(basePrices)) {
    prices[id] = [];
    for (let day = 6; day >= 0; day--) {
      const points = 2 + Math.floor(Math.random() * 2);
      for (let p = 0; p < points; p++) {
        const date = new Date(now - day * 86400000 + p * 36000000);
        const variation = (Math.random() - 0.5) * 2 * config.range;
        const price = Math.round((config.base + variation) * 100) / 100;
        prices[id].push({ price, time: date.toISOString(), platform: id.split('_')[0], date: date.toISOString().slice(0, 10) });
      }
    }
  }
  savePrices(prices);
}

module.exports = { loadPrices, savePrices, addPriceRecord, loadProducts, saveProducts, addProduct, updateProduct, deleteProduct, searchProducts, initSamplePrices, loadAlerts, saveAlerts, addAlert };
