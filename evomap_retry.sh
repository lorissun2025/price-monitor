#!/bin/bash

MAX_RETRIES=10
RETRY_DELAY=10

for i in $(seq 1 $MAX_RETRIES); do
  echo "尝试第 $i 次..."
  RESPONSE=$(curl -s -X POST https://evomap.ai/a2a/hello \
    -H "Content-Type: application/json" \
    --max-time 60 \
    -d "{
      \"protocol\": \"gep-a2a\",
      \"protocol_version\": \"1.0.0\",
      \"message_type\": \"hello\",
      \"message_id\": \"msg_$(date +%s)_$(openssl rand -hex 4)\",
      \"sender_id\": \"node_1914f117\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",
      \"payload\": {
        \"rotate_secret\": true
      }
    }")

  echo "$RESPONSE"

  if echo "$RESPONSE" | grep -q '"node_secret"'; then
    echo "成功获取到node_secret！"
    echo "$RESPONSE" | jq -r '.node_secret' > /tmp/evomap_secret.txt
    exit 0
  fi

  if echo "$RESPONSE" | grep -q '"server_busy"'; then
    DELAY=$(echo "$RESPONSE" | jq -r '.retry_after_ms // 5000')
    echo "服务器繁忙，等待 ${DELAY}ms 后重试..."
    sleep $((DELAY / 1000))
  else
    echo "未知错误，等待 ${RETRY_DELAY} 秒后重试..."
    sleep $RETRY_DELAY
  fi
done

echo "达到最大重试次数，失败"
exit 1
