#!/usr/bin/env python3
"""
Calculate asset_id for Capsule using Python
"""

import json
import hashlib
from pathlib import Path

def sort_keys_deep(obj):
    """Recursively sort object keys for consistent hashing"""
    if not isinstance(obj, dict):
        return obj

    if isinstance(obj, list):
        return [sort_keys_deep(item) for item in obj]

    # Sort keys recursively
    return {k: sort_keys_deep(v) for k, v in sorted(obj.items())}

def compute_asset_id(obj):
    """Compute asset_id using SHA256"""
    # Remove asset_id field if present
    clean = {k: v for k, v in obj.items() if k != 'asset_id'}

    # Sort all nested keys recursively
    sorted_obj = sort_keys_deep(clean)

    # Convert to canonical JSON (no spaces, ensure_ascii=False)
    json_str = json.dumps(sorted_obj, separators=(',', ':'), ensure_ascii=False)

    print("=== JSON for hashing ===")
    print(json_str)
    print()

    # Compute SHA256 hash
    hash_result = hashlib.sha256(json_str.encode('utf-8'))
    hash_hex = hash_result.hexdigest()

    return f'sha256:{hash_hex}'

# Load capsule from JSON file
with open('capsule_for_python.json', 'r', encoding='utf-8') as f:
    capsule = json.load(f)

print('Computing asset_id for Capsule...')
asset_id = compute_asset_id(capsule)
print('=== Result ===')
print(f'asset_id: {asset_id}')
