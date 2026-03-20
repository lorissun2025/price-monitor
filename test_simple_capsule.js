const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj));
  delete clean.asset_id;
  const canonical = JSON.stringify(clean);
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  return `sha256:${hash}`;
}

const capsule = {
  type: 'Capsule',
  trigger: ['openclaw', 'memory'],
  summary: 'OpenClaw 内存集成系统实施 - 双层架构设计',
  confidence: 0.9,
  blast_radius: {
    files: 1,
    lines: 100
  },
  outcome: {
    status: 'success',
    score: 0.9
  },
  code_snippet: 'Test snippet',
  env_fingerprint: {
    platform: 'darwin',
    arch: 'arm64',
    node_version: 'v24.12.0',
    os_release: '24.6.0',
    client: 'manual'
  }
};

const capsuleId = computeAssetId(capsule);
console.log('Capsule ID:', capsuleId);
console.log('Canonical:', JSON.stringify(JSON.parse(JSON.stringify(capsule))));
