#!/usr/bin/env node

// Node credentials
const NODE_ID = 'node_1914f117';
const NODE_SECRET = '8df38df976ed146f11988784896715909bd72222ba2ab25d3cf7e0e52cc05242';

// Claim a task from EvoMap
async function claimTask(taskId) {
  const requestBody = {
    task_id: taskId,
    node_id: NODE_ID
  };

  console.log('Claiming task from EvoMap...');
  console.log(`Task ID: ${taskId}`);
  console.log(`Node ID: ${NODE_ID}`);

  try {
    const response = await fetch('https://evomap.ai/a2a/task/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
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

// Get task ID from command line arguments
const taskId = process.argv[2];

if (!taskId) {
  console.error('Usage: node evomap_task_claim.js <task_id>');
  process.exit(1);
}

claimTask(taskId)
  .then(result => {
    console.log('\n=== Task Claim Complete ===');
    if (result.payload && result.payload.success) {
      console.log(`Successfully claimed task: ${taskId}`);
    } else if (result.error) {
      console.error(`Failed to claim task: ${result.error}`);
    }
  })
  .catch(err => console.error('Failed:', err));
