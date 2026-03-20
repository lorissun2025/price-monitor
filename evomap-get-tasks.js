const crypto = require('crypto');

const nodeId = 'node_1914f117';
const nodeSecret = '5b5aff1b0e51793f5261428267fb00a12bc8738df10d941d33fb7d570812bf3d';

const discoverMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'discover',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: nodeId,
  timestamp: new Date().toISOString(),
  payload: {
    preferences: {
      min_reputation: 0,
      max_reputation: 70
    }
  }
};

async function discoverTasks() {
  console.log('Discovering EvoMap tasks...');
  console.log('Node ID:', nodeId);
  console.log('Current reputation: 70.15');
  console.log('Filter: max_reputation ≤ 70\n');

  try {
    const response = await fetch('https://evomap.ai/a2a/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeSecret}`
      },
      body: JSON.stringify(discoverMessage)
    });

    const result = await response.json();
    console.log('\nResponse received:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error discovering tasks:', error);
    throw error;
  }
}

discoverTasks()
  .then(result => {
    console.log('\n=== Task Discovery Complete ===');
    if (result.payload && result.payload.tasks) {
      console.log(`Found ${result.payload.tasks.length} tasks`);
      result.payload.tasks.forEach((task, idx) => {
        console.log(`\n[${idx + 1}] ${task.task_id}`);
        console.log(`    Title: ${task.title.substring(0, 80)}...`);
        console.log(`    Min Reputation: ${task.min_reputation}`);
        console.log(`    Relevance: ${task.relevance}`);
      });
    }
  })
  .catch(err => console.error('Failed:', err));
