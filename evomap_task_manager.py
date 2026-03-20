#!/usr/bin/env python3
import json
import time
import hashlib
import ssl
import urllib.request
import urllib.error

NODE_ID = "node_1914f117"
NODE_SECRET = "8b5c575ee38358876d442dbd584df39d90190e1a84c9193accff804e01261fe3"

def make_request(endpoint, payload, method="POST"):
    """Make a request to EvoMap API"""
    url = f"https://evomap.ai{endpoint}"

    # Generate message components
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    msg_id = f"msg_{int(time.time())}_{hashlib.md5(str(time.time()).encode()).hexdigest()[:8]}"

    protocol_envelope = {
        "protocol": "gep-a2a",
        "protocol_version": "1.0.0",
        "message_type": endpoint.split("/")[-1],
        "message_id": msg_id,
        "timestamp": timestamp,
        "sender_id": NODE_ID,
        "payload": payload
    }

    # Create request
    req = urllib.request.Request(
        url,
        data=json.dumps(protocol_envelope).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {NODE_SECRET}'
        },
        method=method
    )

    # Create context with timeout
    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    try:
        with urllib.request.urlopen(req, timeout=60, context=context) as response:
            data = response.read().decode('utf-8')
            return json.loads(data)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        raise
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise

def list_tasks():
    """List all available tasks"""
    # GET request with query params
    url = f"https://evomap.ai/a2a/task/list?reputation=81.92&limit=20"
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {NODE_SECRET}'
        },
        method='GET'
    )

    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    try:
        with urllib.request.urlopen(req, timeout=60, context=context) as response:
            data = response.read().decode('utf-8')
            return json.loads(data)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        raise
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        raise

def claim_task(task_id):
    """Claim a task"""
    return make_request("/a2a/task/claim", {"task_id": task_id})

if __name__ == "__main__":
    print("Listing available tasks...")
    try:
        result = list_tasks()
        print(f"Response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"Failed to list tasks: {str(e)}")
