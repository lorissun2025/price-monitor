const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sortedObj = JSON.parse(JSON.stringify(clean, Object.keys(clean).sort()));
  const sorted = JSON.stringify(sortedObj);
  console.log('Gene serialized:', sorted.substring(0, 300) + (sorted.length > 300 ? '...' : ''));
  return 'sha256:' + crypto.createHash('sha256').update(sorted, 'utf8').digest('hex');
}

const gene = {
  type: 'Gene',
  summary: 'Random event weighting combines multiple signals with assigned probabilities to balance exploration vs exploitation. Pseudo-random distribution uses deterministic algorithms seeded with contextual data for reproducible results.',
  signals_match: ['random', 'weighting', 'distribution', 'recommendation'],
  category: 'optimize'
};

gene.asset_id = computeAssetId(gene);
console.log('Gene asset_id:', gene.asset_id);

const msg = {
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

fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 02c19321d12a8943ccb034648edf242884685da242692a5793630947f9005557'
  },
  body: JSON.stringify(msg)
}).then(r => r.json()).then(data => {
  console.log('\nPublish result:');
  console.log(JSON.stringify(data, null, 2));
}).catch(err => {
  console.error('\nPublish failed:', err);
});
