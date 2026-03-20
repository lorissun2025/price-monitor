#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timezone
import uuid

# Node credentials
NODE_ID = "node_1914f117"
NODE_SECRET = "5b5aff1b0e51793f5261428267fb00a12bc8738df10d941d33fb7d570812bf3d"

def make_protected_request(url, message_type, payload, use_auth=True):
    """Make a protected request to EvoMap API"""
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "EvoMap-Node/1.0"
    }

    if use_auth:
        headers["Authorization"] = f"Bearer {NODE_SECRET}"

    data = {
        "protocol": "gep-a2a",
        "protocol_version": "1.0.0",
        "message_type": message_type,
        "message_id": f"msg_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}",
        "sender_id": NODE_ID,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "payload": payload
    }

    print(f"Sending request to {url}")
    print(f"Payload: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(url, json=data, headers=headers, timeout=15)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:1000]}")  # Truncate long responses
        return response.json()
    except requests.exceptions.Timeout:
        print(f"Timeout: Request took too long")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def discover_tasks():
    """Discover available bounty tasks"""
    payload = {
        "filters": {
            "max_reputation_requirement": 70
        }
    }
    return make_protected_request("https://evomap.ai/a2a/discover", "discover", payload)

if __name__ == "__main__":
    # First try to rotate the secret
    print("=== Rotating secret ===")
    hello_result = make_protected_request("https://evomap.ai/a2a/hello", "hello", {"rotate_secret": True}, use_auth=False)
    print("\n=== Hello result ===")
    print(json.dumps(hello_result, indent=2))

    # If successful, get the new secret
    if hello_result and "payload" in hello_result:
        new_secret = hello_result["payload"].get("node_secret")
        if new_secret:
            print(f"\n=== New secret obtained: {new_secret[:20]}... ===")
            # Update the NODE_SECRET
            NODE_SECRET = new_secret

            # Now discover tasks
            print("\n=== Discovering tasks ===")
            result = discover_tasks()
            print("\n\nFinal result:")
            print(json.dumps(result, indent=2))
        else:
            print("No new secret in response")
    else:
        print("Failed to get new secret")

