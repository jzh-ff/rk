#!/usr/bin/env bash
# 本机一键发布脚本（Windows git-bash / macOS / Linux）。
# 用法：bash scripts/deploy-local.sh
# 流程：本机构建 → 打包 dist → 上传服务器 → 原子切换（旧版本保留在 ruankao.old 可回滚）。
# 依赖：~/.ssh 配置了 Host 82.156.224.145（IdentityFile id_ed25519_aiword_deploy）。
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-root@82.156.224.145}"
DIR="${DEPLOY_DIR:-/www/wwwroot/ruankao}"

echo "==> [1/4] 本机构建（base=/ruankao/）"
npm run build

echo "==> [2/4] 打包 dist"
TGZ=$(mktemp -u ruankao-dist-XXXX.tgz)
tar czf "$TGZ" dist
du -sh "$TGZ"

echo "==> [3/4] 上传到 $HOST"
scp "$TGZ" "$HOST:/tmp/ruankao-dist.tgz"

echo "==> [4/4] 服务器原子切换"
ssh "$HOST" "set -e
  rm -rf $DIR.new && mkdir $DIR.new
  tar xzf /tmp/ruankao-dist.tgz -C $DIR.new --strip-components=1
  rm -f /tmp/ruankao-dist.tgz
  rm -rf $DIR.old
  [ -d $DIR ] && mv $DIR $DIR.old || true
  mv $DIR.new $DIR
  echo '✓ 切换完成（旧版在 $DIR.old）'"

rm -f "$TGZ"
echo ""
echo "✓ 发布完成：https://jzhm.fun/ruankao/"
echo "  回滚：ssh $HOST 'rm -rf $DIR.broken && mv $DIR $DIR.broken && mv $DIR.old $DIR'"
