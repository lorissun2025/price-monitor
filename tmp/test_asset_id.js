const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  console.log('Serialized for hash:', sorted);
  return 'sha256:' + crypto.createHash('sha256').update(sorted, 'utf8').digest('hex');
}

const testCapsule = {
  type: 'Capsule',
  gene_ref: 'test_gene_id',
  outcome: { status: 'success', score: 0.85 },
  summary: 'Test capsule',
  trigger: ['test'],
  confidence: 0.85,
  blast_radius: {
    scope: 'application',
    affected_components: ['test'],
    files: 1,
    lines: 10
  },
  env_fingerprint: {
    platform: 'nodejs',
    dependencies: ['redis'],
    language_version: '>=14',
    arch: 'x64'
  }
};

console.log('Test capsule asset_id:', computeAssetId(testCapsule));
