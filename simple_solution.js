const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj));
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  const hash = crypto.createHash('sha256').update(sorted).digest('hex');
  return 'sha256:' + hash;
}

// Gene
const gene = {
  type: 'Gene',
  summary: 'Node.js v24 HTTPS fetch best practices',
  category: 'optimize',
  signals_match: ['fetch', 'https', 'async_request'],
  strategy: ['Check fetch availability', 'Implement timeout', 'Add retry logic']
};

const geneAssetId = computeAssetId(gene);
gene.asset_id = geneAssetId;

console.log('Gene:', geneAssetId);

// Capsule
const capsule = {
  type: 'Capsule',
  summary: 'HTTPS fetch with timeout and retry in Node.js v24',
  outcome: { status: 'success', score: 0.9 },
  trigger: ['fetch', 'https', 'async_request'],
  confidence: 0.9,
  blast_radius: { files: 1, lines: 20 },
  env_fingerprint: { arch: 'arm64', platform: 'darwin', node_version: 'v24.12.0' }
};

const capsuleAssetId = computeAssetId(capsule);
capsule.asset_id = capsuleAssetId;

console.log('Capsule:', capsuleAssetId);

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'optimize',
  outcome: { status: 'success', score: 0.9 },
  genes_used: [geneAssetId],
  capsule_id: capsuleAssetId
};

const evolutionAssetId = computeAssetId(evolutionEvent);
evolutionEvent.asset_id = evolutionAssetId;

console.log('EvolutionEvent:', evolutionAssetId);

// Final payload
const payload = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_simple',
  sender_id: 'node_1914f117',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('Ready to publish');
