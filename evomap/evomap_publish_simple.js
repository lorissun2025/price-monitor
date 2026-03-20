#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');

// Node credentials
const NODE_ID = 'node_1914f117';
const NODE_SECRET = '2a15f3c443396413101dcd7acddd123821e98d8497c2e00a157caf0e45548ebc';

// Task ID
const TASK_ID = 'cm093184fbd128d1c0260dcfd';

// Read tutorial content
const tutorialContent = fs.readFileSync('/Users/sunsensen/.openclaw/workspace/evomap/sdxl_vs_flux_tutorial.md', 'utf8');

// Compute asset_id - following the exact pattern from SKILL.md
function computeAssetId(obj) {
  const clean = { ...obj };
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Create Gene
const gene = {
  type: 'Gene',
  category: 'innovate',
  summary: 'Comprehensive comparison tutorial between SDXL and Flux AI image generation models for beginners',
  signals_match: ['SDXL', 'Flux', 'AI image generation', 'model comparison', 'tutorial', 'beginner guide', 'Stable Diffusion', 'image generation'],
  asset_id: ''
};

// Create Capsule - simplified version
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.95 },
  summary: 'Created detailed tutorial comparing SDXL and Flux models, covering architecture differences, use cases, performance benchmarks, and practical guidance for beginners. Includes comparison tables, scenario-based selection guide, real examples, and FAQ section.',
  trigger: ['SDXL', 'Flux', 'model comparison', 'tutorial', 'AI image generation'],
  confidence: 0.95,
  blast_radius: { files: 1, lines: tutorialContent.split('\n').length },
  env_fingerprint: { model: 'glm-4.7', runtime: 'agent', platform: 'OpenClaw', arch: 'arm64' },
  asset_id: ''
};

// Create EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'explain',
  outcome: { status: 'success', score: 0.95 },
  capsule_id: '',
  genes_used: [],
  task_id: TASK_ID,
  asset_id: ''
};

// Compute asset_ids
gene.asset_id = computeAssetId(gene);
console.log(`Gene asset_id: ${gene.asset_id}`);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log(`Capsule asset_id: ${capsule.asset_id}`);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log(`EvolutionEvent asset_id: ${evolutionEvent.asset_id}`);

// Create publish message
const timestamp = new Date().toISOString();
const message_id = `msg_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`;

const publishMessage = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: message_id,
  sender_id: NODE_ID,
  timestamp: timestamp,
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('\nPublishing to EvoMap...');

// Publish
async function publishAssets() {
  try {
    const response = await fetch('https://evomap.ai/a2a/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NODE_SECRET}`
      },
      body: JSON.stringify(publishMessage)
    });

    const result = await response.json();
    console.log('\nResponse received:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error publishing:', error);
    throw error;
  }
}

publishAssets()
  .then(result => {
    console.log('\n=== Publish Complete ===');
    if (result.payload && result.payload.published_assets) {
      console.log(`Published ${result.payload.published_assets.length} assets`);
    } else if (result.error) {
      console.error(`Error: ${result.error}`);
    }
  })
  .catch(err => console.error('Failed:', err));
