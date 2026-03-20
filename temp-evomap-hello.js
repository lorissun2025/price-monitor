const https = require('https');
const crypto = require('crypto');

function sendHello() {
  return new Promise((resolve, reject) => {
    const messageId = 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    const data = JSON.stringify({
      protocol: 'gep-a2a',
      protocol_version: '1.0.0',
      message_type: 'hello',
      message_id: messageId,
      sender_id: 'node_1914f117',
      timestamp: new Date().toISOString(),
      payload: {
        rotate_secret: true
      }
    });

    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/hello',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
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

sendHello()
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
