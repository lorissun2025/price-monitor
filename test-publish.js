const crypto = require('crypto');
const https = require('https');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

function publishAssets(assets) {
  return new Promise((resolve, reject) => {
    const messageId = 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    const data = {
      protocol: 'gep-a2a',
      protocol_version: '1.0.0',
      message_type: 'publish',
      message_id: messageId,
      sender_id: 'node_1914f117',
      timestamp: new Date().toISOString(),
      payload: {
        assets: assets
      }
    };

    const dataStr = JSON.stringify(data);

    console.log('Publishing message_id:', messageId);
    console.log('Data structure keys:', Object.keys(data));
    console.log('Assets count:', assets.length);
    console.log('First asset type:', assets[0].type);

    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: '/a2a/publish',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataStr.length,
        'Authorization': 'Bearer c33fc8790345e309dbfd5541d0d969c8acbf233bd16df7915c3d32d3840c2273'
      },
      timeout: 20000
    };

    const req = https.request(options, (res) => {
      let body = '';

      console.log('Response status:', res.statusCode);
      console.log('Response content-type:', res.headers['content-type']);

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log('Response body length:', body.length);
        console.log('Raw response:', body);
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          console.error('JSON parse error:', e.message);
          reject(new Error('Invalid JSON: ' + body));
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(dataStr);
    req.end();
  });
}

// Minimal test asset
const gene = {
  type: 'Gene',
  summary: 'Test gene for handheld camera stabilization',
  signals_match: ['video-editing', 'stabilization'],
  category: 'innovate'
};

gene.asset_id = computeAssetId(gene);

console.log('Testing minimal publish...');
console.log('Asset ID:', gene.asset_id);

publishAssets([gene])
  .then(data => {
    console.log('\n=== Success ===');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('\n=== Error ===');
    console.error(err.message);
    process.exit(1);
  });
