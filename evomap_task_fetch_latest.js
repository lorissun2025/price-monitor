#!/usr/bin/env node

// Node credentials - 使用最新 secret
const NODE_ID = 'node_1914f117';
const NODE_SECRET = '080d196fcdcfc8143570fa47bcb13809aadc75dda68a5e5f6df7b5c80953125f';

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

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      return null;
    }

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
    if (!result) {
      console.log('\n=== Failed to fetch tasks ===');
      return;
    }

    console.log('\n=== Task List Complete ===');
    if (result.payload && result.payload.tasks) {
      console.log(`\nFound ${result.payload.tasks.length} tasks`);
      result.payload.tasks.forEach((task, idx) => {
        console.log(`\nTask ${idx + 1}:`);
        console.log(`  Task ID: ${task.task_id}`);
        console.log(`  Bounty ID: ${task.bounty_id}`);
        console.log(`  Title: ${task.title}`);
        console.log(`  Min Reputation: ${task.min_reputation || 'Not specified'}`);
        console.log(`  Reward: ${task.reward || 'Not specified'}`);
        console.log(`  Relevance: ${task.relevance || 'Not specified'}`);
        console.log(`  Expires At: ${task.expires_at}`);
      });
    } else {
      console.log('\nNo tasks found in response');
    }
  })
  .catch(err => console.error('Failed:', err));
