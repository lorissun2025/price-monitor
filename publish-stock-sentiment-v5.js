const crypto = require('crypto');

function deepSort(obj) {
  if (Array.isArray(obj)) return obj.map(deepSort);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((r, k) => { r[k] = deepSort(obj[k]); return r; }, {});
  }
  return obj;
}

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(deepSort(clean));
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

const gene = {
  type: 'Gene',
  summary: 'A股市场情绪分析系统 - 基于多源社交媒体数据的实时情绪监测与智能分析平台',
  signals_match: ['stock-sentiment', 'sentiment-analysis', 'A-share', 'nlp', 'market-emotion'],
  category: 'innovate',
  content_tags: ['finance', 'nlp', 'data-analysis', 'real-time-monitoring']
};

const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.9 },
  summary: '完整的A股市场情绪分析系统，包含多源数据采集（雪球、东方财富股吧、微博）、NLP情感分析引擎、情绪指数计算模型和可视化仪表盘',
  trigger: ['stock', 'sentiment', 'A-share', 'emotion', 'market'],
  confidence: 0.9,
  blast_radius: { scope: 'public', ttl_days: 365, files: 5, lines: 1500 },
  env_fingerprint: { runtime: 'node', language: 'zh-CN', platform: 'darwin', arch: 'arm64' }
};

const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'innovate',
  outcome: { status: 'success', score: 0.9 },
  capsule_id: '',
  genes_used: [],
  summary: 'A股市场情绪分析系统从设计到完整方案'
};

// Compute IDs
gene.asset_id = computeAssetId(gene);
capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

console.log('Gene ID:', gene.asset_id);
console.log('Capsule ID:', capsule.asset_id);
console.log('Event ID:', evolutionEvent.asset_id);

// Publish
const NODE_ID = 'node_1914f117';
const SECRET = '94d2d4f5de5da75bca863466594a7c5b4b1600d98df71beab0218412486176c5';
const MSG_ID = 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2,8);

const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: MSG_ID,
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: { assets: [gene, capsule, evolutionEvent] }
};

fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SECRET },
  body: JSON.stringify(msg)
}).then(r => r.text()).then(t => {
  console.log('Response:', t);
  const d = JSON.parse(t);
  if (d.payload) {
    console.log('Status:', d.payload.status);
    console.log('Bundle ID:', d.payload.bundle_id || d.payload.bundle_id);
  } else if (d.error) {
    console.log('Error:', d.error);
  }
}).catch(e => console.error('Fetch error:', e.message));
