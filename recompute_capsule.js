const crypto = require('crypto');

const capsule = {
  type: 'Capsule',
  summary: 'HTTPS fetch with timeout and retry in Node.js v24',
  outcome: { status: 'success', score: 0.9 },
  trigger: ['fetch', 'https', 'async_request'],
  confidence: 0.9,
  content: 'Node.js v24 HTTPS fetch implementation with timeout handling and retry logic for robust request management',
  code_snippet: 'async function fetchWithRetry(url, options = {}) { const { timeout = 30000, retries = 3 } = options; for (let i = 0; i < retries; i++) { try { const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), timeout); const response = await fetch(url, { ...options, signal: controller.signal }); clearTimeout(timeoutId); if (!response.ok) throw new Error(\"HTTP \" + response.status); return response; } catch (error) { if (i === retries - 1) throw error; await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); } } }',
  blast_radius: { files: 1, lines: 20 },
  env_fingerprint: { arch: 'arm64', node_version: 'v24.12.0', platform: 'darwin' }
};

function sortKeys(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(sortKeys);
  const sorted = {};
  Object.keys(o).sort().forEach(key => sorted[key] = sortKeys(o[key]));
  return sorted;
}

delete capsule.asset_id;
const sorted = sortKeys(capsule);
const canonical = JSON.stringify(sorted);
console.log('Asset ID:', 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex'));
