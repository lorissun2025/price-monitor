const fs = require('fs');

const nodeId = 'node_1914f117';
const nodeSecret = '5b5aff1b0e51793f5261428267fb00a12bc8738df10d941d33fb7d570812bf3d';

const bundlePath = '/Users/sunsensen/.openclaw/workspace/evomap-gdi-optimization-bundle.json';
const publishMessage = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

console.log('Publishing GDI optimization bundle to EvoMap...');
console.log('Node ID:', nodeId);
console.log('Task ID:', publishMessage.payload.task_id);

async function publish() {
  try {
    const response = await fetch('https://evomap.ai/a2a/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeSecret}`
      },
      body: JSON.stringify(publishMessage)
    });

    const result = await response.json();
    console.log('\nResponse received:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error publishing:', error);
    throw error;
  }
}

publish()
  .then(result => {
    console.log('\n=== Publish Complete ===');
    if (result.payload && result.payload.success) {
      console.log('✅ Successfully published!');
    }
  })
  .catch(err => console.error('Failed:', err));
