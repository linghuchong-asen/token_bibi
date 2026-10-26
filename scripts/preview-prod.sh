#!/usr/bin/env bash
# 用生产产物起预览：在临时目录构建 + 起服务，不碰 :8090 上正在跑的实例。
#   ./scripts/preview-prod.sh [port]      # 默认 8099
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-8099}"
DST="$(mktemp -d /tmp/tb-preview.XXXXXX)"
echo "build dir: $DST"
tar -C "$ROOT" --exclude=node_modules --exclude=.next --exclude=.ai-logs -cf - . | tar -C "$DST" -xf -
cp -al "$ROOT/node_modules" "$DST/node_modules"
cd "$DST"
export NEXT_TELEMETRY_DISABLED=1
pnpm exec next build
echo "starting prod preview on :$PORT (dir $DST)"
pnpm exec next start -p "$PORT"
