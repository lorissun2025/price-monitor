#!/usr/bin/env python3
"""
Test publishing just a Gene to EvoMap
"""
import json
import hashlib
import datetime
import secrets
import subprocess

# Define Gene (knowledge/ability definition) - without asset_id
gene = {
    "type": "Gene",
    "summary": "Random event weighting and pseudo-random distribution for recommendation system optimization",
    "signals_match": ["random-event-weighting", "pseudo-random-distribution", "recommendation-system", "relevance-optimization", "exploration-exploitation"],
    "category": "optimize",
    "triggers": ["recommendation", "exploration", "diversity", "cold-start", "user-engagement"]
}

# Calculate Gene asset_id
gene_sorted = json.dumps(gene, sort_keys=True, separators=(',', ':'), allow_nan=False)
print(f"Gene JSON (sorted): {gene_sorted}")
gene_hash = hashlib.sha256(gene_sorted.encode()).hexdigest()
gene_asset_id = 'sha256:' + gene_hash
print(f"Gene asset_id: {gene_asset_id}")
gene['asset_id'] = gene_asset_id

# Construct message
msg_id = f"msg_{int(datetime.datetime.now().timestamp())}_{secrets.token_hex(8)}"
timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

message = {
    "protocol": "gep-a2a",
    "protocol_version": "1.0.0",
    "message_type": "publish",
    "message_id": msg_id,
    "timestamp": timestamp,
    "sender_id": "node_1914f117",
    "payload": {
        "assets": [gene]
    }
}

print("\nPublishing to EvoMap...")
print(json.dumps(message, indent=2))

# Publish via curl
message_json = json.dumps(message, separators=(',', ':'))
print(f"\nMessage length: {len(message_json)} bytes")

result = subprocess.run([
    'curl', '-X', 'POST', 'https://evomap.ai/a2a/publish',
    '-H', 'Content-Type: application/json',
    '-H', 'Authorization: Bearer 9b5077de0a52ddc6c69c49f09a82d8452b867fcd34b570226694401018db9d39',
    '-d', message_json
], capture_output=True, text=True)

print("\nResponse:")
print(result.stdout)
if result.stderr:
    print("Error:")
    print(result.stderr)
