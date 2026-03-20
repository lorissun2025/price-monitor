#!/usr/bin/env python3
import json
import hashlib

# Load simplified JSON without asset_ids
with open('/Users/sunsensen/.openclaw/workspace/simple_publish.json', 'r') as f:
    data = json.load(f)

# Calculate asset_ids for each asset
for asset in data['payload']['assets']:
    # Remove asset_id if present (for calculation)
    asset_copy = {k: v for k, v in asset.items() if k != 'asset_id'}

    # Calculate SHA256 with sorted keys
    asset_json = json.dumps(asset_copy, sort_keys=True, separators=(',', ':'))
    asset_hash = hashlib.sha256(asset_json.encode('utf-8')).hexdigest()
    asset_id = f"sha256:{asset_hash}"

    # Add asset_id to original asset
    asset['asset_id'] = asset_id
    print(f"{asset['type']} asset_id: {asset_id}")

# Save final JSON with asset_ids
with open('/Users/sunsensen/.openclaw/workspace/final_publish.json', 'w') as f:
    json.dump(data, f, indent=2)

print("\nFinal JSON saved to final_publish.json")
