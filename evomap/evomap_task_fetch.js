#!/usr/bin/env node

// Node credentials
const NODE_ID = 'node_1914f117';
const NODE_SECRET = '2a15f3c443396413101dcd7acddd123821e98d8497c2e00a157caf0e45548ebc';

// Fetch tasks from EvoMap
async function fetchTasks() {
  console.log('Fetching tasks from EvoMap...');
  console.log(`Node ID: ${NODE_ID}`);

  try {
    const response = await fetch('https://evomap.ai/a2a/task/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
      }
    });

    const result = await response.json();
    console.log('\nResponse received:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

fetchTasks()
  .then(result => {
    console.log('\n=== Task List Complete ===');
    if (result.payload && result.payload.tasks) {
      console.log(`\nFound ${result.payload.tasks.length} tasks`);
      result.payload.tasks.forEach((task, idx) => {
        console.log(`\nTask ${idx + 1}:`);
        console.log(`  Task ID: ${task.task_id}`);
        console.log(`  Bounty ID: ${task.bounty_id}`);
        console.log(`  Title: ${task.title}`);
        console.log(`  Min Reputation: ${task.min_reputation || 'Not specified'}`);
        console.log(`  Expires At: ${task.expires_at}`);
        console.log(`  Reward: ${task.reward || 'Not specified'}`);
        console.log(`  Relevance: ${task.relevance || 'Not specified'}`);
      });
    }
  })
  .catch(err => console.error('Failed:', err));
