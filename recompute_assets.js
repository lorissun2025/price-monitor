const crypto = require('crypto');

// 计算asset_id的函数 - 确保不包括asset_id字段本身
function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj)); // 深拷贝
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  console.log('Sorted JSON:', sorted);
  const hash = crypto.createHash('sha256').update(sorted).digest('hex');
  return 'sha256:' + hash;
}

// Gene
const gene = {
  type: 'Gene',
  summary: 'Node.js v24 HTTPS fetch best practices: handling global fetch and crypto polyfill',
  category: 'optimize',
  signals_match: ['fetch', 'https', 'node_fetch', 'crypto_polyfill', 'async_request'],
  strategy: ['Analyze Node.js v24 fetch API availability and limitations', 'Provide reliable HTTPS request implementation', 'Handle potential crypto and fetch polyfill issues', 'Include error handling and timeout mechanisms']
};

// Capsule
const capsule = {
  type: 'Capsule',
  summary: 'Complete solution for handling HTTPS fetch requests in Node.js v24, including timeout handling, error recovery, and polyfill compatibility checks',
  outcome: { status: 'success', score: 0.95 },
  trigger: ['fetch', 'https', 'node_fetch', 'async_request'],
  confidence: 0.95,
  content: '# Node.js v24 HTTPS Fetch Best Practices\n\n## Problem Analysis\nIn Node.js v24, `globalThis.fetch` should be natively available, but issues may occur:\n1. fetch requests hang\n2. Missing required crypto polyfill\n3. HTTPS certificate verification failures\n\n## Solution\n\n### 1. Check fetch availability\n```javascript\nfunction getFetchImplementation() {\n  if (typeof globalThis.fetch === "function") {\n    return globalThis.fetch; // Use native fetch (Node v18+)\n  }\n  try {\n    const nodeFetch = require("node-fetch");\n    return nodeFetch;\n  } catch (e) {\n    console.warn("node-fetch not available, falling back to native implementation");\n    return globalThis.fetch;\n  }\n}\n\nconst fetch = getFetchImplementation();\n```\n\n### 2. Enhanced HTTPS fetch wrapper\n```javascript\nconst https = require("https");\n\nasync function enhancedFetch(url, options = {}) {\n  const { timeout = 30000, retries = 3, ...fetchOptions } = options;\n\n  for (let attempt = 0; attempt < retries; attempt++) {\n    try {\n      const controller = new AbortController();\n      const timeoutId = setTimeout(() => controller.abort(), timeout);\n\n      const response = await fetch(url, {\n        ...fetchOptions,\n        signal: controller.signal\n      });\n\n      clearTimeout(timeoutId);\n\n      if (!response.ok) {\n        throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n      }\n\n      return response;\n    } catch (error) {\n      if (attempt < retries - 1) {\n        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);\n        await new Promise(resolve => setTimeout(resolve, backoffTime));\n      } else {\n        throw error;\n      }\n    }\n  }\n}\n```\n\n### 3. HTTPS Agent configuration\n```javascript\nconst https = require("https");\n\nconst httpsAgent = new https.Agent({\n  rejectUnauthorized: process.env.NODE_ENV !== "development",\n  keepAlive: true,\n  keepAliveMsecs: 1000,\n  maxSockets: 50,\n  maxFreeSockets: 10,\n  timeout: 30000\n});\n```\n\n### 4. Usage example\n```javascript\ntry {\n  const response = await enhancedFetch("https://api.example.com/data", {\n    method: "GET",\n    headers: {\n      "Content-Type": "application/json"\n    },\n    timeout: 5000\n  });\n  const data = await response.json();\n  console.log("Success:", data);\n} catch (error) {\n  console.error("Fetch failed:", error);\n}\n```\n\n## Key Points\n- Node.js v18+ natively supports fetch, but requires polyfill fallback support\n- Always set timeout to prevent request hang\n- Implement retry mechanism for reliability\n- Configure HTTPS agent for certificate issues\n- Use AbortController for timeout control',
  code_snippet: 'const crypto = require("crypto");\nconst https = require("https");\n\nfunction getFetchImplementation() {\n  if (typeof globalThis.fetch === "function") {\n    return globalThis.fetch;\n  }\n  try {\n    return require("node-fetch");\n  } catch (e) {\n    return globalThis.fetch;\n  }\n}\n\nconst fetch = getFetchImplementation();\n\nasync function enhancedFetch(url, options = {}) {\n  const { timeout = 30000, retries = 3, ...fetchOptions } = options;\n\n  for (let attempt = 0; attempt < retries; attempt++) {\n    try {\n      const controller = new AbortController();\n      const timeoutId = setTimeout(() => controller.abort(), timeout);\n\n      const response = await fetch(url, {\n        ...fetchOptions,\n        signal: controller.signal\n      });\n\n      clearTimeout(timeoutId);\n\n      if (!response.ok) {\n        throw new Error(`HTTP ${response.status}: ${response.statusText}`);\n      }\n\n      return response;\n    } catch (error) {\n      if (attempt < retries - 1) {\n        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);\n        await new Promise(resolve => setTimeout(resolve, backoffTime));\n      } else {\n        throw error;\n      }\n    }\n  }\n}',
  blast_radius: { files: 1, lines: 30 },
  env_fingerprint: { arch: 'arm64', platform: 'darwin', os_release: '24.6.0', node_version: 'v24.12.0' }
};

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'optimize',
  outcome: { status: 'success', score: 0.95 },
  genes_used: [],
  capsule_id: ''
};

// 计算asset_id
console.log('=== Computing Gene asset_id ===');
const geneAssetId = computeAssetId(gene);
gene.asset_id = geneAssetId;
console.log('Gene asset_id:', geneAssetId);

console.log('\n=== Computing Capsule asset_id ===');
const capsuleAssetId = computeAssetId(capsule);
capsule.asset_id = capsuleAssetId;
console.log('Capsule asset_id:', capsuleAssetId);

console.log('\n=== Computing EvolutionEvent asset_id ===');
evolutionEvent.capsule_id = capsuleAssetId;
evolutionEvent.genes_used = [geneAssetId];
const evolutionAssetId = computeAssetId(evolutionEvent);
evolutionEvent.asset_id = evolutionAssetId;
console.log('EvolutionEvent asset_id:', evolutionAssetId);

// 生成最终JSON
const finalPayload = {
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

console.log('\n=== Final Payload ===');
console.log(JSON.stringify(finalPayload, null, 2));
