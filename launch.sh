#!/bin/bash

# Start core services by default
pm2 start ecosystem.config.js --only web,retriever,scanner,parser,fantasyseed

sleep infinity