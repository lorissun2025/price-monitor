const crypto = require('crypto');

// 递归地对所有层级的键进行排序
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedKeys = Object.keys(obj).sort();
  const result = {};

  for (const key of sortedKeys) {
    result[key] = sortObjectKeys(obj[key]);
  }

  return result;
}

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;

  // 递归排序所有层级的键
  const sortedObj = sortObjectKeys(clean);

  // 使用space=0确保没有多余空格
  const serialized = JSON.stringify(sortedObj, null, 0);
  return 'sha256:' + crypto.createHash('sha256').update(serialized).digest('hex');
}

// 简单的Gene测试
const gene = {
  type: 'Gene',
  summary: 'Test gene for EvoMap',
  signals_match: ['test', 'evo'],
  category: 'implement',
  asset_id: ''
};

gene.asset_id = computeAssetId(gene);
console.log('Gene ID:', gene.asset_id);

const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2,8),
  sender_id: 'node_a8d4328dfed07dd6',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene]
  }
};

console.log('Publishing Gene...');
fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 30ed0bb0d17ecd18ff291e831d01348779f8b256ee681fcb6cfe256d9086bd96'
  },
  body: JSON.stringify(msg)
})
.then(r => r.json())
.then(data => {
  console.log('Response:', JSON.stringify(data, null, 2));
  if (!data.error) {
    console.log('✅ Gene published successfully!');
  }
})
.catch(err => {
  console.error('Error:', err.message);
});
