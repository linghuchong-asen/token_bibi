#!/usr/bin/env bash
set -euo pipefail
cd /root/workspace/token_compare/token-bibi

# 文件用途：每日自动采集管线（ECS 上由 token-bibi-collect.timer 每天 03:45 触发）
# 顺序约定：导入后先生成价格变动记录（对比上一次快照），再打新快照；
# 若先快照后记录，基线会自我对比，变动记录永远为空。
npm run collect:openrouter
npm run import:prices -- --file data/imports/openrouter-collected.csv

npm run collect:siliconflow
npm run import:prices -- --file data/imports/siliconflow-collected.csv

npm run collect:official
npm run import:prices -- --file data/imports/official-collected.csv

# 幽灵核验防线必须在 changelog 之前执行：把源站已不认可（改价/下架）的
# 已核验价格降回待核验，这样降级事件本身也会被价格变动记录捕获留痕。
npm run review:demote-stale

npm run changelog:prices
npm run snapshot
npm run quality:report

# Static pages are generated at build time. Rebuild and restart after data changes
# so the running app reflects the new prices.
npm run build
systemctl restart token-bibi-app.service
