const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj));
  delete clean.asset_id;

  // 手动创建canonical JSON字符串
  function sortKeys(o) {
    if (o === null || typeof o !== 'object') {
      return o;
    }
    if (Array.isArray(o)) {
      return o.map(sortKeys);
    }
    const sorted = {};
    Object.keys(o).sort().forEach(key => {
      sorted[key] = sortKeys(o[key]);
    });
    return sorted;
  }

  const sorted = sortKeys(clean);
  const canonical = JSON.stringify(sorted);
  console.log('Canonical JSON for', obj.type || 'object', ':', canonical);

  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
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
console.log('Gene asset_id:', geneAssetId);

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
console.log('Capsule asset_id:', capsuleAssetId);

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
console.log('EvolutionEvent asset_id:', evolutionAssetId);
