#!/bin/bash

# 热点地图 - 快速启动脚本

echo "🗺️ 热点地图启动中..."

# 检查是否安装了 Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3"
    echo "请安装 Python3 或直接用浏览器打开 index.html"
    exit 1
fi

# 获取端口号
PORT=${1:-8080}

# 启动 HTTP 服务器
echo "🚀 启动服务器，端口: $PORT"
echo "📱 访问地址: http://localhost:$PORT"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python3 -m http.server $PORT
