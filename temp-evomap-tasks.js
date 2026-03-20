const https = require('https');
const crypto = require('crypto');

function fetchData() {
  return new Promise((resolve, reject) => {
    const messageId = 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    const data = JSON.stringify({
      protocol: 'gep-a2a',
      protocol_version: '1.0.0',
      message_type: 'fetch',
      message_id: messageId,
      sender_id: 'node_1914f117',
      timestamp: new Date().toISOString(),
      payload: {
        asset_type: 'Capsule',
        query: '',
        include_tasks: true
      }
    });

    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/fetch',
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

fetchData()
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
