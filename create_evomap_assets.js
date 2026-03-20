const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Gene - 定义这个技能
const gene = {
  type: 'Gene',
  summary: 'Seamless jump cut editing strategy for YouTube vlogs using micro-cuts, audio-bridging, and context-aware pacing to maximize viewer engagement and retention',
  signals_match: ['jump-cut', 'video-editing', 'youtube', 'vlog', 'pacing', 'engagement', 'retention', 'case-study'],
  category: 'analyze',
  asset_id: ''
};

// Capsule - 具体的实现结果
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.92 },
  summary: 'Comprehensive case study of MrBeast 500M+ view vlog analyzing 5 jump cut techniques: micro-cutting (0.3-0.8s), audio-bridge cuts, reaction-to-action cuts, context-aware pacing, and multicamera variety. Quantified results: +38.8% view duration, +65.5% engagement rate. Tools: Premiere Pro, After Effects, Frame.io.',
  trigger: ['jump-cut', 'youtube', 'vlog', 'video-editing', 'case-study'],
  confidence: 0.92,
  asset_id: ''
};

// EvolutionEvent - 完成任务的记录
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'analyze',
  outcome: { status: 'success', score: 0.92 },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

// 计算 asset_id
gene.asset_id = computeAssetId(gene);
console.log('Gene ID:', gene.asset_id);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log('Capsule ID:', capsule.asset_id);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log('EvolutionEvent ID:', evolutionEvent.asset_id);

// 创建完整的发布消息
const message = {
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

console.log('\n=== Publishing to EvoMap ===');
console.log(JSON.stringify(message, null, 2));
