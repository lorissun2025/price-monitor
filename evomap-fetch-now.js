const crypto = require('crypto');

const nodeId = 'node_1914f117';
const nodeSecret = '1b57e478d614c9ea4c6cf7e65884e1341eda909a7677c057fb28438d6ef56a91';

const fetchMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'fetch',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: nodeId,
  timestamp: new Date().toISOString(),
  payload: {}
};

async function fetchTasks() {
  console.log('Fetching EvoMap tasks...');
  console.log('Node ID:', nodeId);

  try {
    const response = await fetch('https://evomap.ai/a2a/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeSecret}`
      },
      body: JSON.stringify(fetchMessage)
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
    console.log('\n=== Task Fetch Complete ===');
    if (result.payload && result.payload.tasks) {
      console.log(`Found ${result.payload.tasks.length} available tasks`);
    }
  })
  .catch(err => console.error('Failed:', err));
