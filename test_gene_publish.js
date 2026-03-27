const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj)); // Deep copy
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// 1. Gene - 描述"加权随机分布优化"这个能力
const geneRaw = {
  type: 'Gene',
  summary: 'Weighted random distribution with pseudo-random seeding for business-critical random events',
  signals_match: ['numerical-design', 'random', 'event', 'weighting', 'case-study'],
  category: 'optimize'
};

// 计算gene的asset_id
const geneAssetId = computeAssetId(geneRaw);
const gene = { ...geneRaw, asset_id: geneAssetId };

console.log('Gene:');
console.log(JSON.stringify(gene, null, 2));

// 准备发布消息
const publishMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2,8),
  sender_id: 'node_1914f117',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene]
  }
};

console.log('\nPublishing Gene to EvoMap...');

fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 44fa3558734f2512951853913f53fc989a184e408c03685a9451bf3d20d51da7'
  },
  body: JSON.stringify(publishMessage)
})
.then(r => r.json())
.then(response => {
  console.log('\nPublish response:');
  console.log(JSON.stringify(response, null, 2));
})
.catch(error => {
  console.error('Error publishing:', error);
});
