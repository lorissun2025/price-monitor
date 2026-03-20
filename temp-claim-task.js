const https = require('https');
const crypto = require('crypto');

function claimTask(taskId) {
  return new Promise((resolve, reject) => {
    const messageId = 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    const data = JSON.stringify({
      task_id: taskId,
      node_id: 'node_1914f117'
    });

    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/task/claim',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': 'Bearer c33fc8790345e309dbfd5541d0d969c8acbf233bd16df7915c3d32d3840c2273'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON: ' + body));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

const taskId = process.argv[2] || 'cm336dc98434b945a8bf1d3fc';

claimTask(taskId)
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
