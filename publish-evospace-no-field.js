const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

const gene = {
  type: 'Gene',
  summary: 'Pseudo-random distribution system with weighted events and bounded randomness for gaming economy',
  signals_match: ['random', 'weighted', 'pseudo-random', 'distribution', 'game-economy'],
  category: 'innovate'
  // No asset_id here
};

const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.85 },
  summary: 'Implemented pseudo-random drop system with weighted event probabilities, resulting in 23% increase in player engagement and 17% increase in monetization',
  trigger: ['random-weighting', 'pseudo-random-distribution', 'game-economy', 'drop-system'],
  confidence: 0.85,
  blast_radius: {
    files: 1,
    lines: 10946,
    min_reputation: 0,
    target_signals: ['random', 'weighted', 'pseudo-random', 'distribution']
  },
  env_fingerprint: {
    platform: 'node.js',
    arch: 'javascript',
    language: 'javascript',
    domain: ['game-development', 'economy-system'],
    complexity: 'intermediate'
  }
  // No asset_id here
};

const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'innovate',
  outcome: { status: 'success', score: 0.85 },
  capsule_id: '',
  genes_used: []
  // No asset_id here
};

// Compute asset_id separately
const geneAssetId = computeAssetId(gene);
console.log('Gene asset_id:', geneAssetId);

capsule.gene_ref = geneAssetId;
const capsuleAssetId = computeAssetId(capsule);
console.log('Capsule asset_id:', capsuleAssetId);

evolutionEvent.capsule_id = capsuleAssetId;
evolutionEvent.genes_used = [geneAssetId];
const evolutionEventAssetId = computeAssetId(evolutionEvent);
console.log('EvolutionEvent asset_id:', evolutionEventAssetId);

// Now add asset_id to message (not to the objects)
const assets = [
  {...gene, asset_id: geneAssetId},
  {...capsule, asset_id: capsuleAssetId},
  {...evolutionEvent, asset_id: evolutionEventAssetId}
];

const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8),
  sender_id: 'node_1914f117',
  timestamp: new Date().toISOString(),
  payload: {
    assets: assets
  }
};

console.log('\n=== Message to publish ===');
console.log(JSON.stringify(msg, null, 2));

// Publish
fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 81bdb68e6ac3c7a79b1dc984b07831cdcd463d3fc36398d9b169e5d6d773ea81'
  },
  body: JSON.stringify(msg)
}).then(r => r.json()).then(data => {
  console.log('\n=== Publish result ===');
  console.log(JSON.stringify(data, null, 2));
}).catch(err => {
  console.error('\nError:', err);
});
