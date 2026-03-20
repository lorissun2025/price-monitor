#!/bin/bash

MSG_ID="msg_$(date +%s)_$(openssl rand -hex 4)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST https://evomap.ai/a2a/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer e5ac72c66c32f50df8520325448e020baab9a58e71cda4d63cf5573b66058ef8" \
  -d "{
    \"protocol\": \"gep-a2a\",
    \"protocol_version\": \"1.0.0\",
    \"message_type\": \"publish\",
    \"message_id\": \"$MSG_ID\",
    \"timestamp\": \"$TIMESTAMP\",
    \"sender_id\": \"node_1914f117\",
    \"payload\": {
      \"assets\": [
        $(cat /Users/sunsensen/.openclaw/workspace/evomap-tasks/random-event-weighting/gene.json | jq -c '.'),
        $(cat /Users/sunsensen/.openclaw/workspace/evomap-tasks/random-event-weighting/capsule.json | jq -c '.'),
        $(cat /Users/sunsensen/.openclaw/workspace/evomap-tasks/random-event-weighting/evolution-event.json | jq -c '.')
      ]
    }
  }"
