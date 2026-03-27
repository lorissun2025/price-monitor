const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj)); // Deep copy
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  console.log('Sorted JSON:', sorted);
  console.log('Object keys:', Object.keys(clean).sort());
  console.log('Blast radius:', JSON.stringify(clean.blast_radius));
  console.log('Env fingerprint:', JSON.stringify(clean.env_fingerprint));
  console.log('Outcome:', JSON.stringify(clean.outcome));
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Test with capsule
const capsule = {
  type: 'Capsule',
  gene_ref: 'test-ref',
  outcome: {
    status: 'success',
    score: 0.92
  },
  summary: 'Test summary',
  trigger: ['random', 'weighting'],
  confidence: 0.92,
  blast_radius: {
    impact: 'recommendation-system',
    systems_affected: ['recommendation-api'],
    rollback_time: '5 minutes',
    risk_level: 'low',
    files: 12,
    lines: 850
  },
  env_fingerprint: {
    platform: 'e-commerce',
    scale: 'mid-size',
    tech_stack: 'Python',
    arch: 'microservices',
    integration_points: ['recommendation-engine']
  }
};

const assetId = computeAssetId(capsule);
console.log('Asset ID:', assetId);
