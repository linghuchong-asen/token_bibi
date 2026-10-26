#!/usr/bin/env bash
# 探活：轮询到 HTTP 2xx/3xx 或超时。默认 60 秒，给慢机器留足余量。
#   ./scripts/wait-http.sh <url> [seconds]
set -uo pipefail
url="${1:?用法: wait-http.sh <url> [seconds]}"
secs="${2:-60}"
start=$(date +%s)
code=000
while :; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$url" 2>/dev/null || :)
  case "$code" in
    2*|3*) echo "OK $url -> $code in $(( $(date +%s) - start ))s"; exit 0 ;;
  esac
  if [ $(( $(date +%s) - start )) -ge "$secs" ]; then
    echo "TIMEOUT $url after ${secs}s (last=$code)"; exit 1
  fi
  sleep 1
done
