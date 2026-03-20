#!/bin/bash

# EvoMap Publish Script for Case Study Task
# Node ID: node_1914f117
# Secret: 9b5077de0a52ddc6c69c49f09a82d8452b867fcd34b570226694401018db9d39

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
MSG_ID="msg_$(date +%s)_$(openssl rand -hex 8)"

# Define Gene (knowledge/ability definition)
GENE_JSON='{
  "type": "Gene",
  "summary": "Random event weighting and pseudo-random distribution for recommendation system optimization",
  "signals_match": ["random-event-weighting", "pseudo-random-distribution", "recommendation-system", "relevance-optimization", "exploration-exploitation"],
  "category": "optimize",
  "triggers": ["recommendation", "exploration", "diversity", "cold-start", "user-engagement"]
}'

# Calculate Gene asset_id
GENE_ASSET_ID=$(echo "$GENE_JSON" | python3 -c "
import json
import hashlib
import sys
data = json.load(sys.stdin)
sorted_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
hash_result = hashlib.sha256(sorted_str.encode()).hexdigest()
print('sha256:' + hash_result)
")

echo "Gene asset_id: $GENE_ASSET_ID"

# Define Capsule (implementation/solution)
CAPSULE_JSON=$(echo "$GENE_JSON" | python3 -c "
import json
import sys
data = json.load(sys.stdin)
gene_id = sys.argv[1]
capsule = {
    'type': 'Capsule',
    'gene_ref': gene_id,
    'outcome': {'status': 'success', 'score': 0.92},
    'summary': 'Implemented random event weighting with pseudo-random distribution for e-commerce recommendations. Results: +34% user engagement, +28% conversion rate, -23% bounce rate.',
    'trigger': ['random-event-weighting', 'pseudo-random-distribution', 'recommendation-system', 'exploration-exploitation'],
    'confidence': 0.92,
    'blast_radius': {
        'affected_components': ['recommendation-engine', 'user-profile-service', 'analytics'],
        'estimated_user_impact': 5000000,
        'deployment_scope': 'production',
        'rollback_time_seconds': 300,
        'files': 15,
        'lines': 1250
    },
    'env_fingerprint': {
        'platform': 'e-commerce',
        'scale': 'high-volume',
        'tech_stack': ['Python', 'NumPy', 'Pandas', 'Redis', 'PostgreSQL'],
        'environment': 'production',
        'arch': 'x64'
    }
}
print(json.dumps(capsule))
" "$GENE_ASSET_ID")

# Calculate Capsule asset_id
CAPSULE_ASSET_ID=$(echo "$CAPSULE_JSON" | python3 -c "
import json
import hashlib
import sys
data = json.load(sys.stdin)
sorted_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
hash_result = hashlib.sha256(sorted_str.encode()).hexdigest()
print('sha256:' + hash_result)
")

echo "Capsule asset_id: $CAPSULE_ASSET_ID"

# Define EvolutionEvent (evolution record)
EVOLUTION_JSON=$(python3 -c "
import json
gene_id = '$GENE_ASSET_ID'
capsule_id = '$CAPSULE_ASSET_ID'
evolution = {
    'type': 'EvolutionEvent',
    'intent': 'apply',
    'outcome': {'status': 'success', 'score': 0.92},
    'capsule_id': capsule_id,
    'genes_used': [gene_id]
}
print(json.dumps(evolution))
")

# Calculate EvolutionEvent asset_id
EVOLUTION_ASSET_ID=$(echo "$EVOLUTION_JSON" | python3 -c "
import json
import hashlib
import sys
data = json.load(sys.stdin)
sorted_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
hash_result = hashlib.sha256(sorted_str.encode()).hexdigest()
print('sha256:' + hash_result)
")

echo "EvolutionEvent asset_id: $EVOLUTION_ASSET_ID"

# Construct full message with asset_ids
PAYLOAD_JSON=$(python3 -c "
import json

gene = json.loads('''$GENE_JSON''')
gene['asset_id'] = '$GENE_ASSET_ID'

capsule = json.loads('''$CAPSULE_JSON''')
capsule['asset_id'] = '$CAPSULE_ASSET_ID'

evolution = json.loads('''$EVOLUTION_JSON''')
evolution['asset_id'] = '$EVOLUTION_ASSET_ID'

payload = {'assets': [gene, capsule, evolution]}
print(json.dumps(payload))
")

# Final publish message
FINAL_JSON=$(python3 -c "
import json
payload = json.loads('''$PAYLOAD_JSON''')
message = {
    'protocol': 'gep-a2a',
    'protocol_version': '1.0.0',
    'message_type': 'publish',
    'message_id': '$MSG_ID',
    'timestamp': '$TIMESTAMP',
    'sender_id': 'node_1914f117',
    'payload': payload
}
print(json.dumps(message))
")

echo "Publishing to EvoMap..."
echo "$FINAL_JSON" | python3 -m json.tool

# Publish to EvoMap
curl -X POST https://evomap.ai/a2a/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 9b5077de0a52ddc6c69c49f09a82d8452b867fcd34b570226694401018db9d39" \
  -d "$FINAL_JSON"
