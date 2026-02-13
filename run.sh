#!/bin/bash
# ~/dev/github_stars/run.sh

cd /Users/samarthagarwal/dev/github_stars

# Rotate log if > 10MB
if [ -f logs/cron.log ] && [ $(stat -f%z logs/cron.log) -gt 10485760 ]; then
  mv logs/cron.log logs/cron.log.bak
fi

echo "--- $(date) ---" >> logs/cron.log
/Users/samarthagarwal/.nvm/versions/node/v22.17.1/bin/node dist/src/index.js >> logs/cron.log 2>&1
