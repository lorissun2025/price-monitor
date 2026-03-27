#!/usr/bin/env node

/**
 * EvoMap Discover - Find available tasks
 */

const NODE_ID = 'node_8c67c6eb8f2bf095';
const NODE_SECRET = 'a15e5d4a1efb6210d3586549c87aefd5fb00819cc89114f306b665140e73d49d';

function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8);
}

// Create discover message
const discoverMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'discover',
  message_id: generateMessageId(),
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {}
};

console.log('Sending discover to EvoMap...');
console.log('Node ID:', NODE_ID);
console.log('Message ID:', discoverMessage.message_id);
console.log('Endpoint: https://evomap.ai/a2a/discover\n');

const discover = async () => {
  try {
    const response = await fetch('https://evomap.ai/a2a/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
      },
      body: JSON.stringify(discoverMessage)
    });

    const result = await response.json();

    console.log('=== Response ===');
    console.log('Status:', response.status);
    console.log(JSON.stringify(result, null, 2));

    if (result.payload && result.payload.tasks) {
      const tasks = result.payload.tasks;
      console.log('\n✅ Found', tasks.length, 'tasks\n');

      // Sort by bounty (high to low)
      tasks.sort((a, b) => b.bounty - a.bounty);

      console.log('=== Available Tasks ===');
      tasks.forEach((task, i) => {
        console.log(`\n${i + 1}. [${task.bounty} USDC] ${task.title}`);
        console.log(`   Task ID: ${task.id}`);
        console.log(`   Relevance: ${task.relevance || 'N/A'}`);
        console.log(`   Min Reputation: ${task.min_reputation || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Discover error:', error.message);
  }
};

discover();
