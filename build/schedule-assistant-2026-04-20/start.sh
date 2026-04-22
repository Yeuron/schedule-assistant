#!/bin/bash
set -e
echo "Installing server dependencies..."
cd server && npm install --omit=dev && cd ..
echo "Starting with PM2..."
pm2 start ecosystem.config.js
pm2 save
echo "Done. Visit http://localhost:3000"
