const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && key !== 'asset_id') {
      clean[key] = obj[key];
    }
  }
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return { json: sorted, hash: 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex') };
}

const capsule = {
  type: 'Capsule',
  gene_ref: 'sha256:6c3995a88ff74a38269635a65362734c3e13805ed26038a21c0c72f7dd2427bb',
  outcome: { status: 'success', score: 0.89 },
  summary: 'E-commerce platform recommendation system using pseudo-random distribution with business-weighted events.',
  trigger: ['recommendation', 'ab-testing', 'fairness', 'random-weighting', 'cold-start'],
  confidence: 0.89,
  blast_radius: {
    affected_components: ['recommendation_engine', 'ab_test_framework', 'user_frontend'],
    scope: 'product_recommendation_service',
    risk_level: 'low',
    rollback_plan: 'Switch back to pure random selection within 1 deployment cycle',
    files: 3,
    lines: 156
  },
  env_fingerprint: {
    runtime: 'nodejs',
    platform: 'cloud',
    arch: 'x64',
    dependencies: ['none', 'pure_javascript'],
    version_constraints: 'node >= 14.0.0'
  },
  implementation: {
    use_case: 'E-commerce product recommendation',
    problem: 'Traditional pure random recommendations created bias: popular items dominated, new products never exposed, A/B tests were non-deterministic.',
    solution: {
      approach: 'Pseudo-random distribution with business-weighted events',
      core_technique: 'Use seeded random generators for reproducibility, assign weights to products based on business metrics, apply pseudo-random distribution (Fisher-Yates shuffle with weighted sampling).'
    },
    results: {
      before: { 'top_10_items_shown': '75%', 'new_products_exposed': '<5%', 'ab_test_reproducibility': '0%' },
      after: { 'top_10_items_shown': '45%', 'new_products_exposed': '35%', 'ab_test_reproducibility': '100%', 'revenue_impact': '+12%', 'user_satisfaction': '+8%' }
    },
    business_impact: {
      industry: 'E-commerce',
      applicability: ['Product recommendation', 'Ad placement', 'Feature rollout', 'Content distribution'],
      metrics: ['+12% revenue', '+35% new product discovery', '100% A/B test reproducibility', '-40% cold-start bias']
    },
    lessons_learned: [
      'Pure random = fairness but suboptimal business outcome',
      'Pure weighted = optimization but creates bias and unfairness',
      'Pseudo-random + weighting = balance of fairness + optimization',
      'Deterministic seeding is critical for scientific testing',
      'Weight formulas should be tunable without code changes'
    ]
  },
  asset_id: ''
};

const result = computeAssetId(capsule);
console.log('JSON (first 1000 chars):', result.json.substring(0, 1000));
console.log('Full JSON length:', result.json.length);
console.log('\nHash:', result.hash);

// Save to file for inspection
const fs = require('fs');
fs.writeFileSync('/Users/sunsensen/.openclaw/workspace/temp/capsule_json.txt', result.json);
console.log('\nSaved to: /Users/sunsensen/.openclaw/workspace/temp/capsule_json.txt');
