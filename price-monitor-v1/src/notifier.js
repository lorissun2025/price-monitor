// notifier.js - 提醒模块 v0.3（飞书webhook + 内存队列 + 历史记录）
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { addAlert, loadAlerts } = require('./storage');

const notifications = [];

function loadConfig() {
  const cfgPath = path.join(__dirname, '..', 'config.json');
  if (!fs.existsSync(cfgPath)) return { feishu: { enabled: false, webhookUrl: '' } };
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function sendFeishu(title, text) {
  const config = loadConfig();
  if (!config.feishu || !config.feishu.enabled || !config.feishu.webhookUrl) {
    return; // 没有配置webhook，静默跳过
  }
  const url = new URL(config.feishu.webhookUrl);
  const body = JSON.stringify({
    msg_type: 'interactive',
    card: {
      header: { title: { tag: 'plain_text', content: title }, template: 'orange' },
      elements: [
        { tag: 'markdown', content: text },
        { tag: 'note', elements: [{ tag: 'plain_text', content: '价格监控系统 v0.3 自动推送' }] }
      ]
    }
  });
  const postData = Buffer.from(body, 'utf8');
  const req = (url.protocol === 'https:' ? https : http).request(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      const result = JSON.parse(data);
      if (result.code !== 0) console.error('飞书推送失败:', result.msg);
      else console.log('✅ 飞书推送成功');
    });
  });
  req.on('error', (e) => console.error('飞书推送网络错误:', e.message));
  req.write(postData);
  req.end();
}

function checkAlert(result, product) {
  const prices = require('./storage').loadPrices();
  const history = prices[result.productId] || [];
  const prev = history.length > 1 ? history[history.length - 2] : null;
  let triggered = false;
  let msg = '';

  // 检查目标价
  if (result.alert) {
    msg = `🔔 降价提醒！${result.name} 当前 ¥${result.price}，已低于目标价 ¥${result.targetPrice}`;
    triggered = true;
  }
  // 检查降价幅度
  if (!triggered && prev && product && product.alertPercent) {
    const drop = ((prev.price - result.price) / prev.price * 100);
    if (drop >= product.alertPercent) {
      msg = `📉 大幅降价！${result.name} 从 ¥${prev.price.toFixed(2)} 降至 ¥${result.price}，降幅 ${drop.toFixed(1)}%`;
      triggered = true;
    }
  }

  if (triggered && msg) {
    console.log(msg);
    notifications.push({ time: new Date().toISOString(), message: msg, type: 'alert' });
    // 保存历史记录
    addAlert({ message: msg, productId: result.productId, productName: result.name, type: 'alert' });
    // 推送飞书
    const url = product ? product.url : '';
    const feishuText = msg + (url ? `\n[查看商品](${url})` : '');
    sendFeishu('🔔 价格提醒', feishuText);
  }
  return triggered;
}

function getNotifications() { return [...notifications]; }
function clearNotifications() { notifications.length = 0; }

module.exports = { checkAlert, getNotifications, clearNotifications };
