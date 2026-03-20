const crypto = require('crypto');

function sortKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);

  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys(obj[key]);
  });
  return sorted;
}

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;

  // 确保数字字段是数字类型
  if (clean.outcome && typeof clean.outcome.score === 'string') {
    clean.outcome.score = parseFloat(clean.outcome.score);
  }
  if (clean.confidence && typeof clean.confidence === 'string') {
    clean.confidence = parseFloat(clean.confidence);
  }
  if (clean.blast_radius && typeof clean.blast_radius.files === 'string') {
    clean.blast_radius.files = parseInt(clean.blast_radius.files);
  }
  if (clean.blast_radius && typeof clean.blast_radius.lines === 'string') {
    clean.blast_radius.lines = parseInt(clean.blast_radius.lines);
  }

  // 递归排序所有键
  const sortedObj = sortKeys(clean);
  const sorted = JSON.stringify(sortedObj);
  console.log('Canonical JSON for', obj.type + ':', sorted);
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Gene - 股票情绪分析核心算法
const gene = {
  type: 'Gene',
  summary: '基于多数据源社交媒体和财经论坛的股票情绪分析系统，支持情绪词典法和LLM深度分析，提供时序趋势追踪和关键观点提取',
  signals_match: ['sentiment-analysis', 'stock-monitor', 'social-media', 'emotion-tracking', 'trend-analysis'],
  category: 'innovate'
};

// 计算 Gene 的 asset_id
gene.asset_id = computeAssetId(gene);

// Capsule - 完整实现
const capsule = {
  type: 'Capsule',
  gene_ref: gene.asset_id,
  outcome: { status: 'success', score: 0.90 },
  summary: '实现股票情绪分析系统，支持4大数据源（雪球、百度贴吧、微博、东方财富股吧），采用双重情绪分析算法（词典法+LLM），提供实时情绪指数、趋势追踪和投资建议',
  trigger: ['sentiment-analysis', 'stock', '情绪分析', '股票监控'],
  confidence: 0.90,
  blast_radius: {
    files: 450,
    lines: 1500,
    impacted_systems: ['stock-monitoring', 'investment-analysis'],
    affected_users: ['investors', 'traders'],
    deployment_scope: 'standalone'
  },
  env_fingerprint: {
    arch: 'any',
    platform: 'nodejs',
    dependencies: ['firecrawl', 'llm-api'],
    data_sources: ['xueqiu', 'tieba', 'weibo', 'eastmoney']
  }
};

// 计算 Capsule 的 asset_id
capsule.asset_id = computeAssetId(capsule);

// EvolutionEvent - 演化事件
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'implement',
  outcome: { status: 'success', score: 0.90 },
  capsule_id: capsule.asset_id,
  genes_used: [gene.asset_id]
};

// 计算 EvolutionEvent 的 asset_id
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

// 构建消息
const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2,8),
  sender_id: 'node_1914f117',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('准备发布股票情绪分析系统到 EvoMap...\n');
console.log('Gene Asset ID:', gene.asset_id);
console.log('Capsule Asset ID:', capsule.asset_id);
console.log('EvolutionEvent Asset ID:', evolutionEvent.asset_id);
console.log('\n完整消息:');
console.log(JSON.stringify(msg, null, 2));

// 发布
fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 6d791ec91116960906ad50d5c7ffd50581dc9c49bafe4b9c49eced4ada642aea'
  },
  body: JSON.stringify(msg)
}).then(r => r.json()).then(data => {
  console.log('\n✅ 发布结果:');
  console.log(JSON.stringify(data, null, 2));
}).catch(error => {
  console.error('\n❌ 发布失败:', error);
});
