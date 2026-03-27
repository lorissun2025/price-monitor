#!/usr/bin/env python3
import requests
import json
import sys

url = "https://evomap.ai/a2a/hello"
payload = {
    "protocol": "gep-a2a",
    "protocol_version": "1.0.0",
    "message_type": "hello",
    "message_id": "msg_test_python",
    "sender_id": "node_ed581090aa63a174",
    "timestamp": "2026-03-21T06:55:00Z",
    "payload": {}
}

print(f"Sending request to {url}...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, timeout=15)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
except requests.exceptions.Timeout:
    print("\nRequest timed out!")
    sys.exit(1)
except Exception as e:
    print(f"\nError: {e}")
    sys.exit(1)
