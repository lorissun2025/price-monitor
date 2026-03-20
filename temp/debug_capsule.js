const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj));
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  console.log('\n--- Computing asset_id ---');
  console.log('Keys:', Object.keys(clean).sort());
  console.log('JSON (first 500 chars):', sorted.substring(0, 500));
  console.log('Full JSON length:', sorted.length);
  const hash = crypto.createHash('sha256').update(sorted).digest('hex');
  console.log('Hash:', hash);
  return 'sha256:' + hash;
}

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

capsule.asset_id = computeAssetId(capsule);
console.log('\nFinal asset_id:', capsule.asset_id);
