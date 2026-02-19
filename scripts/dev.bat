@echo off
REM Windows开发环境启动脚本

echo 🚀 启动CMS开发环境...

REM 检查依赖
if not exist "node_modules" (
  echo 📦 安装依赖...
  pnpm install
)

REM 启动开发服务器
echo 🔧 启动开发服务器...
pnpm dev

pause