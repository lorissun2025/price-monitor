#!/bin/bash

# 热点地图系统启动脚本

echo "🚀 正在启动热点地图系统..."
echo ""

# 启动 API 服务器
echo "📡 启动 API 服务器..."
cd /Users/sunsensen/.openclaw/workspace/hotspot-system/api
npm run dev > /tmp/hotspot-api.log 2>&1 &
API_PID=$!
echo "✅ API 服务器已启动 (PID: $API_PID)"
echo "📍 地址: http://localhost:3000"
echo ""

# 保存 PID
echo $API_PID > /tmp/hotspot-api.pid

echo "💡 提示："
echo "   - 前端：打开 file:///Users/sunsensen/.openclaw/workspace/hotspot-map/index.html"
echo "   - API 文档：http://localhost:3000"
echo "   - 健康检查：http://localhost:3000/health"
echo "   - 停止服务：kill $API_PID 或 ./stop.sh"
echo ""
echo "🎉 热点地图系统启动成功！"
echo ""
