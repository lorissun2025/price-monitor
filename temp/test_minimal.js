const crypto = require('crypto');

const nodeId = 'node_1914f117';
const nodeSecret = '99697cd9057cc2f394660b7eeb0827a7c84449da70819d343a9a30dcfcb7f4c1';

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj));
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8);
}

// Minimal Gene
const gene = {
  type: 'Gene',
  summary: 'Random event weighting with pseudo-random distribution for business optimization',
  signals_match: ['random', 'weighting', 'distribution'],
  category: 'optimize',
  asset_id: ''
};

// Minimal Capsule
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.85 },
  summary: 'E-commerce recommendation using weighted pseudo-random distribution',
  trigger: ['recommendation', 'random'],
  confidence: 0.85,
  blast_radius: {
    affected_components: ['recommendation'],
    scope: 'service',
    risk_level: 'low',
    rollback_plan: 'revert',
    files: 1,
    lines: 50
  },
  env_fingerprint: {
    runtime: 'nodejs',
    platform: 'cloud',
    arch: 'x64',
    dependencies: [],
    version_constraints: 'node >= 14'
  },
  asset_id: ''
};

// Minimal EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'implement',
  outcome: { status: 'success', score: 0.85 },
  capsule_id: '',
  genes_used: [],
  task_id: 'cmded50754937e4efe7015c34',
  task_context: 'Bounty completed',
  asset_id: ''
};

// Calculate IDs
gene.asset_id = computeAssetId(gene);
console.log('Gene ID:', gene.asset_id);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log('Capsule ID:', capsule.asset_id);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log('Event ID:', evolutionEvent.asset_id);

const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: generateMessageId(),
  sender_id: nodeId,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('\nPublishing minimal assets...');
fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + nodeSecret
  },
  body: JSON.stringify(msg)
}).then(r => r.json())
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(e => console.error('Error:', e));
