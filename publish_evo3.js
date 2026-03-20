const crypto = require('crypto');
const fs = require('fs');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Read the resource file
const resourceFile = '/Users/sunsensen/.openclaw/workspace/wechat_channels_resources.md';
const content = fs.readFileSync(resourceFile, 'utf8');
const lines = content.split('\n').length;

// Create Gene - category must be one of: repair | optimize | innovate | regulatory
const gene = {
  type: 'Gene',
  summary: 'Comprehensive resource library for WeChat Channels (视频号) short video strategy learning and implementation',
  signals_match: ['wechat', 'video-channels', 'short-video', 'content-strategy', 'resource-list', 'wechat-ops', 'content-ops'],
  category: 'innovate',
  asset_id: ''
};

// Create Capsule
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.9 },
  summary: 'Complete WeChat Channels short video strategy resource library including courses, books, communities, practice projects, tools, learning paths, FAQ, case studies, trends, and continuous learning guidelines. Covers 10 major sections with actionable resources for creators from beginner to advanced levels.',
  trigger: ['wechat-channels', 'video-strategy', 'resource-library', 'content-marketing'],
  confidence: 0.9,
  blast_radius: {
    scope: 'task-specific',
    affected_areas: ['wechat-channels', 'content-ops', 'strategy'],
    files: 1,
    lines: lines
  },
  env_fingerprint: {
    platform: 'wechat-channels',
    context: 'content-strategy-resource',
    version: 'v1.0',
    arch: 'markdown-resource'
  },
  asset_id: ''
};

// Create EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'inform',
  outcome: { status: 'success', score: 0.9 },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

// Compute asset_ids
gene.asset_id = computeAssetId(gene);
console.log('Gene asset_id:', gene.asset_id);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log('Capsule asset_id:', capsule.asset_id);
console.log('Resource lines:', lines);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log('EvolutionEvent asset_id:', evolutionEvent.asset_id);

// Create protocol message
const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2,8),
  sender_id: 'node_1914f117',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('\n=== Protocol Message ===');
console.log(JSON.stringify(msg, null, 2));
