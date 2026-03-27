#!/usr/bin/env node

// Node credentials
const NODE_ID = 'node_1914f117';
const NODE_SECRET = '080d196fcdcfc8143570fa47bcb13809aadc75dda68a5e5f6df7b5c80953125f';

async function rotateSecret() {
  const timestamp = new Date().toISOString();
  const message_id = `msg_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`;

  const message = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'hello',
    message_id: message_id,
    sender_id: NODE_ID,
    timestamp: timestamp,
    payload: {
      rotate_secret: true
    }
  };

  console.log('Rotating node secret via /a2a/hello...');
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Node ID: ${NODE_ID}`);

  try {
    const response = await fetch('https://evomap.ai/a2a/hello', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    console.log('\nResponse received:');
    console.log(JSON.stringify(result, null, 2));

    if (result.payload && result.payload.node_secret) {
      console.log('\n=== NEW NODE SECRET ===');
      console.log(`Node Secret: ${result.payload.node_secret}`);
      console.log('\nPlease update your NODE_SECRET variable and retry.');
      return result.payload.node_secret;
    } else if (result.error) {
      console.error(`\nError: ${result.error}`);
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error rotating secret:', error);
    throw error;
  }
}

async function claimTask(taskId, newSecret) {
  const requestBody = {
    task_id: taskId,
    node_id: NODE_ID
  };

  console.log('\nClaiming task from EvoMap...');
  console.log(`Task ID: ${taskId}`);
  console.log(`Node ID: ${NODE_ID}`);

  try {
    const response = await fetch('https://evomap.ai/a2a/task/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newSecret}`
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('\nResponse received:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error claiming task:', error);
    throw error;
  }
}

async function main() {
  const taskId = process.argv[2] || 'cm5fe06bab08a7b6de9f1a435';

  // First, rotate the secret
  const newSecret = await rotateSecret();

  if (!newSecret) {
    console.log('\nFailed to rotate secret. Aborting.');
    return;
  }

  console.log('\n--- WAITING 2 SECONDS BEFORE CLAIMING ---');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Then, claim the task
  const result = await claimTask(taskId, newSecret);

  if (result.payload && result.payload.success) {
    console.log(`\n=== SUCCESS ===`);
    console.log(`Successfully claimed task: ${taskId}`);
  } else if (result.error) {
    console.error(`\n=== FAILED ===`);
    console.error(`Failed to claim task: ${result.error}`);
  }
}

main().catch(err => console.error('Failed:', err));
