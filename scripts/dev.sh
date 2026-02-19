#!/bin/bash

# 开发环境启动脚本

set -e

echo "🚀 启动CMS开发环境..."

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  pnpm install
fi

# 启动开发服务器
echo "🔧 启动开发服务器..."
pnpm dev