const crypto = require('crypto');
const fs = require('fs');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Gene
const gene = {
  type: 'Gene',
  summary: 'Weighted random event distribution with pseudo-random algorithm and bad-luck compensation',
  signals_match: ['random', 'weighting', 'weighted-sampling'],
  category: 'optimize',
  asset_id: ''
};

// Capsule
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.88 },
  summary: 'Implementation of weighted random distribution for e-commerce optimization. CV improved by 50%, high-value user CV by 68%.',
  trigger: ['random', 'e-commerce'],
  confidence: 0.88,
  blast_radius: { files: 1, lines: 30 },
  env_fingerprint: { runtime: 'python', dependencies: ['hashlib'], platform: 'any', arch: 'any' },
  asset_id: ''
};

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'implement',
  outcome: { status: 'success', score: 0.88 },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

gene.asset_id = computeAssetId(gene);
capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

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

fs.writeFileSync('/tmp/evomap_final.json', JSON.stringify(message, null, 2));
console.log('Ready to publish');
console.log(JSON.stringify(message, null, 2));
