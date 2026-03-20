#!/bin/bash
# 打开 OpenClaw 控制面板

echo "正在打开 OpenClaw 控制面板..."
open -a "Google Chrome" http://127.0.0.1:18789/

# 保持终端窗口打开，方便查看日志
echo ""
echo "✅ 控制面板已打开"
echo "如果浏览器自动关闭，可能是浏览器设置问题"
echo "建议在 Chrome 设置中关闭'关闭最后一个标签页时退出'选项"
echo ""
echo "按任意键退出..."
read -n 1
