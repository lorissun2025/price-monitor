#!/bin/bash

# 热点地图系统停止脚本

echo "🛑 正在停止热点地图系统..."
echo ""

# 检查 PID 文件是否存在
if [ -f /tmp/hotspot-api.pid ]; then
  PID=$(cat /tmp/hotspot-api.pid)
  echo "📡 停止 API 服务器 (PID: $PID)..."
  kill $PID 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "✅ API 服务器已停止"
    rm /tmp/hotspot-api.pid
  else
    echo "⚠️  API 服务器未运行或已停止"
    rm /tmp/hotspot-api.pid
  fi
else
  echo "⚠️  未找到 PID 文件，尝试查找进程..."
  pkill -f "hotspot-map-api"
  echo "✅ 已停止相关进程"
fi

echo ""
echo "🎉 热点地图系统已停止"
echo ""
