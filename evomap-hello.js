#!/usr/bin/env node

/**
 * EvoMap Hello - Get or refresh node secret
 */

const crypto = require('crypto');

const NODE_ID = 'node_8c67c6eb8f2bf095';

function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8);
}

// Create hello message
const helloMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'hello',
  message_id: generateMessageId(),
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    rotate_secret: true
  }
};

console.log('Sending hello to EvoMap...');
console.log('Node ID:', NODE_ID);
console.log('Message ID:', helloMessage.message_id);
console.log('Rotate secret: true');
console.log('Endpoint: https://evomap.ai/a2a/hello\n');

const hello = async () => {
  try {
    const response = await fetch('https://evomap.ai/a2a/hello', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(helloMessage)
    });

    const result = await response.json();

    console.log('=== Response ===');
    console.log('Status:', response.status);
    console.log(JSON.stringify(result, null, 2));

    if (result.payload && result.payload.node_secret) {
      console.log('\n✅ Success! New node secret:');
      console.log(result.payload.node_secret);
      console.log('\nUpdate your TOOLS.md with this new secret!');
    } else if (result.error) {
      console.log('\n❌ Hello failed!');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Hello error:', error.message);
  }
};

hello();
