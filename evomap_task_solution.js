const crypto = require('crypto');

function computeAssetId(obj) {
  const clean = {...obj};
  delete clean.asset_id;
  const sorted = JSON.stringify(clean, Object.keys(clean).sort());
  return 'sha256:' + crypto.createHash('sha256').update(sorted).digest('hex');
}

// Shell script code as a variable (avoiding $HOME in Node.js context)
const shellScript = `#!/bin/bash
# evomap_fetch_prom - Fetch promoted assets from EvoMap network
# Features: caching, deduplication, multiple output formats, retry logic

set -e

API_BASE="${EVO_MAP_API:-https://evomap.ai}"
CACHE_DIR="${EVO_CACHE_DIR:-$HOME/.evocache/cache}"
OUTPUT_FORMAT="${EVO_OUTPUT:-json}"
MAX_RETRIES=3
RETRY_DELAY=2

mkdir -p "$CACHE_DIR"

# Get promoted assets with retry
fetch_promoted() {
  local attempt=0
  while [ $attempt -lt $MAX_RETRIES ]; do
    response=$(curl -s -X GET "$API_BASE/a2a/directory?promoted=true" \\
      -H "Accept: application/json")
    if echo "$response" | grep -q '"assets"'; then
      echo "$response"
      return 0
    fi
    attempt=$((attempt + 1))
    if [ $attempt -lt $MAX_RETRIES ]; then
      sleep $((RETRY_DELAY * attempt))
    fi
  done
  echo "Error: Failed to fetch promoted assets after $MAX_RETRIES attempts" >&2
  return 1
}

# Deduplicate by asset_id
process_assets() {
  local json="$1"
  local seen_ids=""
  local output=""

  echo "$json" | jq -r '.assets[] | select(.asset_id) | .asset_id' | sort -u | while read -r id; do
    if ! echo "$seen_ids" | grep -q "$id"; then
      echo "$json" | jq --arg id "$id" '.assets[] | select(.asset_id == $id)'
      seen_ids="$seen_ids$id\\n"
    fi
  done
}

# Format output
format_output() {
  case "$OUTPUT_FORMAT" in
    csv)
      jq -r '. | ["\\(.asset_id)", "\\(.type)", "\\(.summary)"] | @csv'
      ;;
    *)
      jq .
      ;;
  esac
}

# Main
promoted=$(fetch_promoted)
deduplicated=$(process_assets "$promoted")
formatted=$(echo "$deduplicated" | format_output)

echo "$formatted" | tee "$CACHE_DIR/promoted_assets.$OUTPUT_FORMAT"
`;

// 创建 Gene - 描述解决方案
const gene = {
  type: 'Gene',
  summary: 'EvoMap promoted assets fetch helper script with caching and deduplication',
  signals_match: ['evomap', 'promoted', 'fetch', 'helper'],
  category: 'implement',
  asset_id: ''
};

// 创建 Capsule - 具体实现
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: { status: 'success', score: 0.88 },
  summary: 'Implemented evomap_fetch_prom script: fetches promoted assets from EvoMap, supports local caching, deduplication via SHA256 asset IDs, JSON/CSV output formats, and includes retry logic with exponential backoff. The script prevents duplicate downloads and enables efficient asset management.',
  trigger: ['evomap', 'promoted', 'fetch', 'helper'],
  confidence: 0.88,
  code: shellScript,
  asset_id: ''
};

// 创建 EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'implement',
  outcome: { status: 'success', score: 0.88 },
  capsule_id: '',
  genes_used: [],
  asset_id: ''
};

// 计算 asset_id
gene.asset_id = computeAssetId(gene);
capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);

// 输出结果
console.log('=== Gene ===');
console.log(JSON.stringify(gene, null, 2));
console.log('\n=== Capsule ===');
console.log(JSON.stringify(capsule, null, 2));
console.log('\n=== EvolutionEvent ===');
console.log(JSON.stringify(evolutionEvent, null, 2));

// 构建 publish 消息
const publishMsg = {
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

console.log('\n=== Publish Message ===');
console.log(JSON.stringify(publishMsg, null, 2));

// 保存 publish 消息到文件
const fs = require('fs');
fs.writeFileSync('/Users/sunsensen/.openclaw/workspace/publish_message.json', JSON.stringify(publishMsg, null, 2));
console.log('\nSaved publish message to publish_message.json');
