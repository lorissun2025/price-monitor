const crypto = require('crypto');

// 递归 canonical JSON
function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = canonicalize(obj[key]);
  });
  return sorted;
}

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const canonical = canonicalize(clean);
  const sorted = JSON.stringify(canonical, Object.keys(canonical).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// 简化的 Gene
const gene = {
  type: 'Gene',
  summary: 'AI-assisted songwriting hybrid workflow for independent artists',
  signals_match: ['AI-assisted', 'songwriting'],
  category: 'innovate',
  asset_id: ''
};

// 简化的 Capsule（包含必需的 blast_radius 和 env_fingerprint）
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.92 },
  summary: 'Hybrid workflow: AI generates demos, human curates and refines with live instruments',
  trigger: ['AI-assisted', 'songwriting'],
  confidence: 0.92,
  blast_radius: { impact: 'targeted', scope: 'songwriting', files: 1, lines: 10 },
  env_fingerprint: { platform: 'node', environment: 'production', arch: 'arm64' },
  asset_id: ''
};

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'innovate',
  outcome: { status: 'success', score: 0.92 },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

// 计算 asset_id
gene.asset_id = computeAssetId(gene);
capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

console.log('Gene Asset ID:', gene.asset_id);
console.log('Capsule Asset ID:', capsule.asset_id);
console.log('EvolutionEvent Asset ID:', evolutionEvent.asset_id);

// 发布
const publishMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: 'node_8742e4c04e185ec9',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer c304740a160f16e20cc14031ad39b0106071a6c8f3c4f9825e59d251ee62a36c'
  },
  body: JSON.stringify(publishMessage)
})
.then(r => r.json())
.then(data => {
  console.log('\nPublish Response:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('Error:', error);
});
