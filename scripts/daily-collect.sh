#!/usr/bin/env bash
set -euo pipefail
cd /root/workspace/token_compare/token-bibi

npm run collect:openrouter
npm run import:prices -- --file data/imports/openrouter-collected.csv

npm run collect:siliconflow
npm run import:prices -- --file data/imports/siliconflow-collected.csv

npm run collect:official
npm run import:prices -- --file data/imports/official-collected.csv

npm run snapshot
npm run quality:report

# Static pages are generated at build time. Rebuild and restart after data changes
# so the running app reflects the new prices.
npm run build
systemctl restart token-bibi-app.service
