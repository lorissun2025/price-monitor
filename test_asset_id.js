const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// 测试 Capsule
const capsule = {
  type: 'Capsule',
  gene_ref: 'test_gene_ref',
  outcome: { status: 'success', score: 0.92 },
  summary: 'Test summary',
  trigger: ['AI-assisted', 'songwriting'],
  confidence: 0.92,
  blast_radius: { impact: 'targeted', scope: 'songwriting-workflow', files: 1, lines: 10 },
  env_fingerprint: { platform: 'node', environment: 'production', arch: 'arm64' },
  asset_id: ''
};

console.log('Before computeAssetId:');
console.log(JSON.stringify(capsule, null, 2));

const assetId = computeAssetId(capsule);
console.log('\nComputed Asset ID:', assetId);

// 验证
capsule.asset_id = assetId;
const recompute = computeAssetId(capsule);
console.log('Recomputed Asset ID:', recompute);
console.log('Match:', assetId === recompute);

// 打印排序后的 JSON
console.log('\nSorted JSON:');
const clean = {...capsule};
delete clean.asset_id;
const sorted = JSON.stringify(clean, Object.keys(clean).sort());
console.log(sorted);
