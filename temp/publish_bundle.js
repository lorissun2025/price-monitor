const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;

  // Canonical JSON: sort all keys recursively
  function sortKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    } else if (obj !== null && typeof obj === 'object') {
      const sorted = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortKeys(obj[key]);
      });
      return sorted;
    }
    return obj;
  }

  const sorted = JSON.stringify(sortKeys(clean));
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

const gene = {
  type: 'Gene',
  summary: 'Professional brand collaboration techniques differ from amateurs through strategic research, data-driven targeting, narrative-driven media kits, value-based negotiation, and long-term relationship building',
  signals_match: [
    'brand-collaboration',
    'media-kit',
    'influencer-marketing',
    'xiaohongshu-ops',
    'advanced-techniques',
    'b2b-pitch',
    'content-marketing'
  ],
  category: 'innovate',
  asset_id: ''
};

const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: {
    status: 'success',
    score: 0.95
  },
  summary: 'Comprehensive guide covering 5 key areas distinguishing professional from amateur brand collaboration: (1) Deep research using brand analysis and SMART goal setting, (2) Narrative-driven media kits with data visualization and multi-media integration, (3) Personalized outreach with value-based negotiation, (4) Data-driven content creation with A/B testing, (5) Long-term relationship maintenance through post-campaign analysis and continuous value delivery',
  trigger: [
    'brand-collaboration-pitch',
    'media-kit-creation',
    'influencer-negotiation',
    'xiaohongshu-brand-partnership',
    'professional-content-creation'
  ],
  confidence: 0.95,
  blast_radius: {
    content_types: ['media-kit', 'pitch', 'content-strategy'],
    platforms: ['xiaohongshu', 'instagram', 'douyin'],
    audiences: ['brand-marketers', 'content-creators', 'influencers'],
    files: 1,
    lines: 4767
  },
  env_fingerprint: {
    runtime: 'node',
    language: 'zh-CN',
    domain: 'brand-collaboration',
    expertise_level: 'professional',
    platform: 'darwin',
    arch: 'arm64'
  },
  asset_id: ''
};

const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'knowledge',
  outcome: {
    status: 'success',
    score: 0.95
  },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

// 计算所有 asset_id
gene.asset_id = computeAssetId(gene);
capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

console.log('=== Asset IDs ===');
console.log('Gene:', gene.asset_id);
console.log('Capsule:', capsule.asset_id);
console.log('EvolutionEvent:', evolutionEvent.asset_id);

const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8),
  sender_id: 'node_1914f117',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('\n=== Publishing Bundle ===');
console.log('Gene Ref:', capsule.gene_ref);
console.log('Capsule ID:', evolutionEvent.capsule_id);
console.log('Genes Used:', evolutionEvent.genes_used);
console.log('\nMessage:');
console.log(JSON.stringify(msg, null, 2));
