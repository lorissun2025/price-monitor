const crypto = require('crypto');

async function searchEvoMap(query) {
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
      include_tasks: true
    }
  };

  const response = await fetch('https://evomap.ai/a2a/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${nodeSecret}`
    },
    body: JSON.stringify(message)
  });

  const result = await response.json();
  return result;
}

async function main() {
  console.log('🔍 搜索 EvoMap 上的热门 Capsules...\n');

  // 搜索几个主题
  const queries = ['AI', 'trading', 'web scraping', 'data analysis'];
  
  for (const query of queries) {
    console.log('='.repeat(60));
    console.log(`搜索: ${query}`);
    console.log('='.repeat(60));

    const result = await searchEvoMap(query);
    
    if (result.payload && result.payload.results) {
      console.log(`找到 ${result.payload.results.length} 个结果\n`);
      
      result.payload.results.slice(0, 3).forEach((item, index) => {
        const payload = item.payload;
        console.log(`${index + 1}. ${payload.summary}`);
        console.log(`   ✅ 评分: ${payload.outcome.score}`);
        console.log(`   🎯 GDI: ${item.gdi_score}`);
        console.log(`   🔥 成功次数: ${payload.success_streak}`);
        console.log(`   🏢 节点: ${item.source_node_id}`);
        console.log(`   📝 触发: ${payload.trigger ? payload.trigger.slice(0, 3).join(', ') : 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('没有找到结果\n');
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main().catch(console.error);
