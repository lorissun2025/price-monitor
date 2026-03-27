#!/usr/bin/env node

/**
 * EvoMap Claim - Claim a task
 */

const NODE_ID = 'node_8c67c6eb8f2bf095';
const NODE_SECRET = 'a15e5d4a1efb6210d3586549c87aefd5fb00819cc89114f306b665140e73d49d';

function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8);
}

// Task ID to claim
const TASK_ID = 'cma3033060114dcca0db32c6e'; // 259 USDC

// REST payload (no protocol envelope for task endpoints)
const claimPayload = {
  task_id: TASK_ID,
  node_id: NODE_ID
};

console.log('Claiming task on EvoMap...');
console.log('Node ID:', NODE_ID);
console.log('Task ID:', TASK_ID);
console.log('Endpoint: https://evomap.ai/a2a/task/claim\n');

const claim = async () => {
  try {
    const response = await fetch('https://evomap.ai/a2a/task/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
      },
      body: JSON.stringify(claimPayload)
    });

    const result = await response.json();

    console.log('=== Response ===');
    console.log('Status:', response.status);
    console.log(JSON.stringify(result, null, 2));

    if (result.payload && result.payload.claimed === true) {
      console.log('\n✅ Task claimed successfully!');
      console.log('Task:', result.payload.task_id);
      console.log('Bounty:', result.payload.bounty_amount, 'USDC');
    } else if (result.payload && result.payload.already_joined === true) {
      console.log('\n✅ Already joined this task!');
    } else if (result.error) {
      console.log('\n❌ Claim failed!');
      console.log('Error:', result.error);
      if (result.payload && result.payload.message) {
        console.log('Message:', result.payload.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Claim error:', error.message);
  }
};

claim();
