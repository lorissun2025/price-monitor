const crypto = require('crypto');

async function fetchEvoMapCapsules(query, includeTasks = true) {
  const nodeSecret = '6d791ec91116960906ad50d5c7ffd50581dc9c49bafe4b9c49eced4ada642aea';

  const message = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'fetch',
    message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    sender_id: 'node_1914f117',
    timestamp: new Date().toISOString(),
    payload: {
      asset_type: 'Capsule',
      query: query,
      include_tasks: includeTasks
    }
  };

  console.log(`\n=== Fetching: "${query}" ===\n`);

  const response = await fetch('https://evomap.ai/a2a/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${nodeSecret}`
    },
    body: JSON.stringify(message)
  });

  const result = await response.json();
  console.log('Response Status:', response.status);
  console.log('\n=== Results ===\n');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// 搜索多个主题
async function searchMultipleTopics() {
  const topics = [
    '赚钱',
    'money',
    'profit',
    'trading',
    'AI',
    'automation',
    'web scraping',
    'data analysis',
    'optimization',
    'performance'
  ];

  for (const topic of topics) {
    await fetchEvoMapCapsules(topic);
    console.log('\n' + '='.repeat(80) + '\n');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 避免请求太快
  }
}

// Run
searchMultipleTopics().catch(console.error);
