const express = require('express');
const path = require('path');
const fs = require('fs');
const { checkAll, fetchProductPrice } = require('./src/monitor');
const { loadProducts, loadPrices, addPriceRecord, addProduct, updateProduct, deleteProduct, searchProducts, initSamplePrices, loadAlerts } = require('./src/storage');
const { checkAlert, getNotifications, clearNotifications } = require('./src/notifier');

initSamplePrices();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CONFIG_PATH = path.join(__dirname, 'config.json');

// --- Config ---
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return { interval: 30, feishu: { enabled: false, webhookUrl: '' } };
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

// --- Auto Monitor State ---
let monitorTimer = null;
let monitorRunning = false;
let lastCheckTime = null;
let nextCheckTime = null;

function startMonitor() {
  stopMonitor();
  const config = loadConfig();
  const interval = (config.interval || 30) * 60 * 1000;
  monitorRunning = true;
  lastCheckTime = null;
  nextCheckTime = Date.now() + interval;
  console.log(`⏰ 自动监控已启动，每 ${config.interval || 30} 分钟检查一次`);
  monitorTimer = setInterval(async () => {
    if (monitorRunning) await runAutoCheck();
  }, interval);
}

function stopMonitor() {
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  monitorRunning = false;
  nextCheckTime = null;
  console.log('⏸ 自动监控已停止');
}

async function runAutoCheck() {
  try {
    const results = await checkAll();
    const products = loadProducts();
    results.forEach(r => {
      const product = products.find(p => p.id === r.productId);
      if (product) checkAlert(r, product);
    });
    lastCheckTime = new Date().toISOString();
    const config = loadConfig();
    nextCheckTime = Date.now() + (config.interval || 30) * 60 * 1000;
    console.log(`✅ 自动检查完成 ${new Date().toLocaleTimeString()}，检查 ${results.length} 个商品`);
  } catch (err) {
    console.error('❌ 自动检查失败:', err.message);
  }
}

// --- APIs ---
app.get('/api/products', (req, res) => {
  const keyword = req.query.search;
  const products = keyword ? searchProducts(keyword) : loadProducts();
  const prices = loadPrices();
  res.json({ products, prices });
});

app.post('/api/products', (req, res) => {
  try {
    const product = addProduct(req.body);
    res.json({ ok: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const product = updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  res.json({ ok: true, product });
});

app.delete('/api/products/:id', (req, res) => {
  deleteProduct(req.params.id);
  res.json({ ok: true });
});

app.post('/api/check', async (req, res) => {
  try {
    const results = await checkAll();
    const products = loadProducts();
    results.forEach(r => {
      const product = products.find(p => p.id === r.productId);
      if (product) checkAlert(r, product);
    });
    lastCheckTime = new Date().toISOString();
    const config = loadConfig();
    nextCheckTime = Date.now() + (config.interval || 30) * 60 * 1000;
    res.json({ results, notifications: getNotifications() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications', (req, res) => res.json(getNotifications()));
app.delete('/api/notifications', (req, res) => { clearNotifications(); res.json({ ok: true }); });

app.get('/api/trend/:productId', (req, res) => {
  const prices = loadPrices();
  res.json(prices[req.params.productId] || []);
});

// --- Monitor Status ---
app.get('/api/monitor/status', (req, res) => {
  const config = loadConfig();
  res.json({
    running: monitorRunning,
    interval: config.interval || 30,
    lastCheck: lastCheckTime,
    nextCheck: nextCheckTime,
  });
});

app.post('/api/monitor/toggle', (req, res) => {
  if (monitorRunning) { stopMonitor(); res.json({ running: false }); }
  else { startMonitor(); res.json({ running: true }); }
});

// --- Config ---
app.get('/api/config', (req, res) => res.json(loadConfig()));
app.put('/api/config', (req, res) => {
  const config = { ...loadConfig(), ...req.body };
  if (req.body.feishu) config.feishu = { ...loadConfig().feishu, ...req.body.feishu };
  saveConfig(config);
  if (monitorRunning) startMonitor(); // 重启定时器以应用新间隔
  res.json({ ok: true, config });
});

// --- Alert History ---
app.get('/api/alerts', (req, res) => res.json(loadAlerts()));
app.delete('/api/alerts', (req, res) => {
  const { saveAlerts } = require('./storage');
  saveAlerts([]);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 价格监控系统 v0.3 已启动 http://localhost:${PORT}`);
  startMonitor(); // 启动时自动开始监控
});
