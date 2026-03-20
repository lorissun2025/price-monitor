const crypto = require('crypto');

function computeAssetId(obj) {
  // Remove asset_id field
  const clean = {...obj};
  delete clean.asset_id;

  // Custom canonical JSON serialization
  function canonical(obj) {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') return JSON.stringify(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    if (Array.isArray(obj)) {
      return '[' + obj.map(canonical).join(',') + ']';
    }

    if (typeof obj === 'object') {
      const sortedKeys = Object.keys(obj).sort();
      const pairs = sortedKeys.map(key => {
        return JSON.stringify(key) + ':' + canonical(obj[key]);
      });
      return '{' + pairs.join(',') + '}';
    }

    return String(obj);
  }

  const canonicalJson = canonical(clean);
  console.log('Canonical JSON:', canonicalJson);
  const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
  return 'sha256:' + hash;
}

// Gene
const gene = {
  type: 'Gene',
  summary: 'Seamless jump cut editing strategy for YouTube vlogs using micro-cuts, audio-bridging, and context-aware pacing to maximize viewer engagement and retention',
  signals_match: ['jump-cut', 'video-editing', 'youtube', 'vlog', 'pacing', 'engagement', 'retention', 'case-study'],
  category: 'innovate'
};

console.log('\n=== Computing Gene ID ===');
const geneId = computeAssetId(gene);
gene.asset_id = geneId;
console.log('Gene ID:', geneId);

// Capsule
const capsule = {
  type: 'Capsule',
  gene_ref: geneId,
  outcome: { status: 'success', score: 0.92 },
  summary: 'Comprehensive case study of MrBeast 500M+ view vlog analyzing 5 jump cut techniques: micro-cutting (0.3-0.8s), audio-bridge cuts, reaction-to-action cuts, context-aware pacing, and multicamera variety. Quantified results: +38.8% view duration, +65.5% engagement rate. Tools: Premiere Pro, After Effects, Frame.io.',
  trigger: ['jump-cut', 'youtube', 'vlog', 'video-editing', 'case-study'],
  confidence: 0.92,
  blast_radius: { files: 1, lines: 350 },
  env_fingerprint: { platform: 'case-study', arch: 'analysis' }
};

console.log('\n=== Computing Capsule ID ===');
const capsuleId = computeAssetId(capsule);
capsule.asset_id = capsuleId;
console.log('Capsule ID:', capsuleId);

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'analyze',
  outcome: { status: 'success', score: 0.92 },
  capsule_id: capsuleId,
  genes_used: [geneId]
};

console.log('\n=== Computing EvolutionEvent ID ===');
const eventIds = computeAssetId(evolutionEvent);
evolutionEvent.asset_id = eventIds;
console.log('EvolutionEvent ID:', eventIds);

console.log('\n=== Final Assets ===');
console.log(JSON.stringify({ gene, capsule, evolutionEvent }, null, 2));

// Export for shell
console.log('\n=== EXPORT ===');
console.log(`GENE_ID="${geneId}"`);
console.log(`CAPSULE_ID="${capsuleId}"`);
console.log(`EVENT_ID="${eventIds}"`);
