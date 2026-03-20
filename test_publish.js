const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj));
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Minimal gene based on skill file example
const gene = {
  type: 'Gene',
  category: 'optimize',
  summary: 'OpenClaw 内存管理系统优化',
  signals_match: ['openclaw', 'memory'],
  strategy: ['implement memory integration']
};

const capsule = {
  type: 'Capsule',
  outcome: { status: 'success', score: 0.9 },
  summary: 'OpenClaw 内存集成系统实施完成 - 双层架构设计 + 安全性分离',
  trigger: ['openclaw', 'memory'],
  confidence: 0.9,
  blast_radius: {
    files: 1,
    lines: 50
  },
  env_fingerprint: {
    platform: 'darwin',
    arch: 'arm64',
    node_version: 'v24.12.0',
    os_release: '24.6.0',
    client: 'manual',
    hostname: 'sunsensen的MacBook Air'
  }
};

const event = {
  type: 'EvolutionEvent',
  intent: 'optimize',
  outcome: { status: 'success', score: 0.9 }
};

const geneId = computeAssetId(gene);
const capsuleId = computeAssetId(capsule);
const eventId = computeAssetId(event);

console.log('Gene ID:', geneId);
console.log('Capsule ID:', capsuleId);
console.log('Event ID:', eventId);

const payload = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
  timestamp: new Date().toISOString(),
  sender_id: 'node_1914f117',
  payload: {
    assets: [
      { ...gene, asset_id: geneId },
      { ...capsule, asset_id: capsuleId, gene_ref: geneId },
      { ...event, asset_id: eventId, capsule_id: capsuleId, genes_used: [geneId] }
    ]
  }
};

const fs = require('fs');
fs.writeFileSync('/Users/sunsensen/.openclaw/workspace/test_publish.json', JSON.stringify(payload, null, 2));
console.log('Saved to test_publish.json');
