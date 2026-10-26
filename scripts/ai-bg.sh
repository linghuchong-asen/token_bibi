#!/usr/bin/env bash
# AI 长任务后台运行器：启动即返回，避免 agent 卡死在工具超时上。
#   ./scripts/ai-bg.sh run <name> -- <command...>
#   ./scripts/ai-bg.sh status <name> [lines]
#   ./scripts/ai-bg.sh wait <name> [seconds]
#   ./scripts/ai-bg.sh kill <name>
#   ./scripts/ai-bg.sh list
set -uo pipefail

ROOT="${AI_ROOT:-$PWD}"
LOG_DIR="${AI_LOG_DIR:-$ROOT/.ai-logs}"
mkdir -p "$LOG_DIR"

die() { echo "ai-bg: $*" >&2; exit 2; }
[ $# -ge 1 ] || die "缺少子命令 (run|status|wait|kill|list)"

cmd="$1"; shift
case "$cmd" in
  run)
    name="${1:-}"; shift || true
    [ -n "$name" ] || die "run 需要任务名"
    [ "${1:-}" = "--" ] && shift
    [ $# -ge 1 ] || die "run 需要命令"
    log="$LOG_DIR/$name.log"; exitf="$LOG_DIR/$name.exit"; pidf="$LOG_DIR/$name.pid"
    rm -f "$exitf"
    ( cd "$ROOT" && \
      LOG="$log" EXITF="$exitf" setsid bash -c '"$@" > "$LOG" 2>&1; echo $? > "$EXITF"' _ "$@" \
      >/dev/null 2>&1 & echo $! > "$pidf" )
    echo "started name=$name pid=$(cat "$pidf") log=$log"
    ;;
  status)
    name="${1:?status 需要任务名}"; lines="${2:-20}"
    log="$LOG_DIR/$name.log"; exitf="$LOG_DIR/$name.exit"
    [ -f "$log" ] || die "没有这个任务的日志: $log"
    if [ -f "$exitf" ]; then echo "state=finished exit=$(cat "$exitf")"; else echo "state=running"; fi
    echo "--- tail -n $lines ---"
    tail -n "$lines" "$log"
    ;;
  wait)
    name="${1:?wait 需要任务名}"; secs="${2:-120}"
    exitf="$LOG_DIR/$name.exit"
    i=0
    while [ ! -f "$exitf" ] && [ "$i" -lt "$secs" ]; do sleep 1; i=$((i+1)); done
    if [ -f "$exitf" ]; then echo "finished exit=$(cat "$exitf") after ${i}s"; else echo "still running after ${secs}s"; fi
    ;;
  kill)
    name="${1:?kill 需要任务名}"; pidf="$LOG_DIR/$name.pid"
    [ -f "$pidf" ] || die "没有 pid 文件"
    kill -TERM -"$(cat "$pidf")" 2>/dev/null || kill -TERM "$(cat "$pidf")" 2>/dev/null
    echo "killed $name"
    ;;
  list)
    for f in "$LOG_DIR"/*.exit; do [ -e "$f" ] || continue; echo "$(basename "$f" .exit): exit=$(cat "$f")"; done
    for f in "$LOG_DIR"/*.log; do [ -e "$f" ] || continue; n="$(basename "$f" .log)"; [ -f "$LOG_DIR/$n.exit" ] || echo "$n: running"; done
    ;;
  *) die "未知子命令: $cmd" ;;
esac
