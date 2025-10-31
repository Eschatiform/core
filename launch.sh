#!/bin/bash

# Ensure node_modules exists (in case named volume is empty on first run)
if [ ! -d "/usr/src/node_modules" ] || [ ! -f "/usr/src/node_modules/.bin/pm2" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start core services by default
pm2 start ecosystem.config.js --only web,retriever,scanner,parser,fantasyseed

sleep infinity