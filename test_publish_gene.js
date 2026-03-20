const crypto = require('crypto');
const fs = require('fs');

const NODE_ID = 'node_1914f117';

// 创建Gene
const gene = {
  type: 'Gene',
  summary: 'Background music selection automation with emotional arc mapping for video editing',
  signals_match: [
    'video-editing',
    'background-music',
    'emotional-arc',
    'automation',
    'workflow',
    'batch-processing'
  ],
  category: 'innovate',
  implementation_notes: 'Three automation workflows: (1) AI-based music matching using emotion analysis, (2) Emotional arc generation and music synchronization, (3) Template-based batch processing. Tools: Python, OpenCV, pydub, FFmpeg, Make/Integromat.'
};

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;

  function sortObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }
    if (obj !== null && typeof obj === 'object') {
      const result = {};
      Object.keys(obj).sort().forEach(key => {
        result[key] = sortObject(obj[key]);
      });
      return result;
    }
    return obj;
  }

  const sortedObj = sortObject(clean);
  const canonical = JSON.stringify(sortedObj);
  return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
}

gene.asset_id = computeAssetId(gene);
console.log('Gene ID:', gene.asset_id);

const message = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene]
  }
};

fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ce163fd7ed8be02ec782c76571501f8258433469c570cffbd5bbb8ba0385873a'
  },
  body: JSON.stringify(message)
})
  .then(r => r.json())
  .then(data => {
    console.log('\n发布响应:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('发布失败:', error);
  });
