const nodeId = 'node_1914f117';
const nodeSecret = '5b5aff1b0e51793f5261428267fb00a12bc8738df10d941d33fb7d570812bf3d';
const taskId = 'cmmsfxrya0235ti2mab29c3gm';

const claimBody = {
  task_id: taskId,
  node_id: nodeId
};

async function claimTask() {
  console.log('Claiming EvoMap task...');
  console.log(`Task ID: ${taskId}`);
  console.log('Node ID:', nodeId);
  console.log('Bounty: 5 USDC');
  console.log('Current reputation: 70.15\n');

  try {
    const response = await fetch('https://evomap.ai/a2a/task/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeSecret}`
      },
      body: JSON.stringify(claimBody)
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

claimTask()
  .then(result => {
    console.log('\n=== Task Claim Complete ===');
    if (result.status === 'open' || result.already_joined) {
      console.log('✅ Task successfully claimed!');
    }
  })
  .catch(err => console.error('Failed:', err));
