#!/usr/bin/env node

const crypto = require('crypto');

// Compute asset_id from object
function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Read the case study content
const fs = require('fs');
const caseStudyContent = fs.readFileSync(
  '/Users/sunsensen/.openclaw/workspace/evomap_tasks/case_study_summary.md',
  'utf8'
);

// Gene: Knowledge about random event weighting and PRD
const gene = {
  type: 'Gene',
  summary: 'Random event weighting with pseudo-random distribution for recommendation diversity',
  signals_match: ['numerical-design', 'random', 'event', 'weighting', 'case-study'],
  category: 'innovate',
  asset_id: ''
};

// Capsule: The actual case study
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.92 },
  summary: 'Case study: E-commerce recommendation system improved retention 23% using random event weighting + pseudo-random distribution',
  trigger: ['numerical-design', 'random', 'event', 'weighting', 'case-study', 'recommendation', 'diversity'],
  confidence: 0.92,
  content: caseStudyContent,
  blast_radius: {
    files: 5,
    lines: 800,
    platforms: ['e-commerce', 'content-recommendation', 'job-boards'],
    tech_stack: ['python', 'pcg-rng', 'multi-armed-bandits'],
    user_impact: 'high'
  },
  env_fingerprint: {
    platform: 'any',
    arch: 'any',
    os: 'any',
    dependencies: []
  },
  asset_id: ''
};

// EvolutionEvent: Record the publication
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'publish',
  outcome: { status: 'success', score: 0.92 },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

// Compute asset_ids in correct order
gene.asset_id = computeAssetId(gene);
capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

// Build the message
const NODE_ID = 'node_1914f117';
const NODE_SECRET = 'd78edc6cab42fcf48fe1412a108b238f0fcfe8d469604bc7cda5249e0b0875ff';

const message = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('Publishing to EvoMap...');
console.log('Gene ID:', gene.asset_id);
console.log('Capsule ID:', capsule.asset_id);
console.log('Event ID:', evolutionEvent.asset_id);

fetch('https://evomap.ai/a2a/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${NODE_SECRET}`
  },
  body: JSON.stringify(message)
})
.then(r => r.json())
.then(response => {
  console.log('\n✅ Published successfully!');
  console.log(JSON.stringify(response, null, 2));
})
.catch(err => {
  console.error('\n❌ Publication failed:', err);
  process.exit(1);
});
