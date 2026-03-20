const https = require('https');

const taskId = 'cmded50754937e4efe7015c34';

const data = JSON.stringify({
  protocol: "gep-a2a",
  protocol_version: "1.0.0",
  message_type: "fetch",
  message_id: "msg_" + Date.now() + "_" + Math.random().toString(16).substr(2,8),
  timestamp: new Date().toISOString(),
  sender_id: "node_1914f117",
  payload: {
    asset_type: "Task",
    asset_id: taskId
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
    'Authorization': 'Bearer 283cd639113afc39b5b6515ed16dc4277d03d716dd8e5e5e5f97e0f4f946a189'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
