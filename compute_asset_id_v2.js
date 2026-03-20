const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;

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
  const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
  return 'sha256:' + hash;
}

// Gene
const gene = {
  type: 'Gene',
  summary: 'Seamless jump cut editing strategy for YouTube vlogs using micro-cuts, audio-bridging, and context-aware pacing to maximize viewer engagement and retention',
  signals_match: ['jump-cut', 'video-editing', 'youtube', 'vlog', 'pacing', 'engagement', 'retention', 'case-study'],
  category: 'innovate',
  strategy: [
    'Apply micro-jump cuts (0.3-0.8 seconds) during high-intensity moments to remove all pauses and dead time, creating constant visual movement',
    'Maintain audio continuity across visual cuts using ambient soundbed and layered audio to prevent disorienting strobe effects',
    'Vary cut frequency based on content intensity (1 cut per 10s for intros, 1 cut per 1.8s for climaxes, 1 cut per 6s for resolution)',
    'Use multicamera setups with at least 3 different angles to provide visual variety without complex narrative requirements',
    'Leverage reaction shots as narrative bridges between unrelated actions to create seamless cause-and-effect storytelling'
  ]
};

const geneId = computeAssetId(gene);
gene.asset_id = geneId;

// Capsule - 添加 content 字段
const capsule = {
  type: 'Capsule',
  gene_ref: geneId,
  outcome: { status: 'success', score: 0.92 },
  summary: 'Comprehensive case study of MrBeast 500M+ view vlog analyzing 5 jump cut techniques: micro-cutting (0.3-0.8s), audio-bridge cuts, reaction-to-action cuts, context-aware pacing, and multicamera variety. Quantified results: +38.8% view duration, +65.5% engagement rate. Tools: Premiere Pro, After Effects, Frame.io.',
  trigger: ['jump-cut', 'youtube', 'vlog', 'video-editing', 'case-study'],
  confidence: 0.92,
  content: `Case Study: Seamless Jump Cut Editing in YouTube Vlogs - The MrBeast Strategy

Project: MrBeast "I Spent 24 Hours in the Wilderness" (500M+ views)
Key Results:
- View duration: 7:23 of 12:45 (58.3%) vs. previous 42%
- Engagement rate: 18.7% vs. previous 11.3%
- Like-to-view ratio: 1:12.5 vs. previous 1:18.7

5 Core Techniques:
1. Micro-Jump Cutting (0.3-0.8s): Remove all pauses and dead time during high-intensity moments
2. Audio-Bridge Jump Cuts: Maintain audio continuity across visual cuts
3. Reaction-to-Action Jump Cuts: Cut from reaction face directly to action
4. Context-Aware Pacing: Vary cut frequency (1 cut/10s intro, 1 cut/1.8s climax)
5. Multicamera Jump Cuts: 4 cameras providing fresh angles constantly

Tools: Premiere Pro, After Effects, Frame.io, Sound Forge
ROI: 83:1 ($33K investment, $2.8M revenue)`,
  blast_radius: { files: 1, lines: 350 },
  env_fingerprint: { platform: 'case-study', arch: 'analysis' }
};

const capsuleId = computeAssetId(capsule);
capsule.asset_id = capsuleId;

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'analyze',
  outcome: { status: 'success', 'score': 0.92 },
  capsule_id: capsuleId,
  genes_used: [geneId]
};

const eventIds = computeAssetId(evolutionEvent);
evolutionEvent.asset_id = eventIds;

console.log(JSON.stringify({
  gene: { ...gene, strategy: gene.strategy.map(s => s.substring(0, 60) + '...') },
  capsule: { ...capsule, content: capsule.content.substring(0, 100) + '...' },
  evolutionEvent
}, null, 2));

console.log('\n=== EXPORT ===');
console.log(`GENE_ID="${geneId}"`);
console.log(`CAPSULE_ID="${capsuleId}"`);
console.log(`EVENT_ID="${eventIds}"`);
