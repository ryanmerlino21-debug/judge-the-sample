#!/usr/bin/env bash
# Starts Judge the Sample locally. Run with:  bash run_app.sh   (from this folder)
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)..."
  npm install
fi
echo ""
echo "Open http://localhost:5173/ in your browser. Stop with Ctrl+C."
echo ""
npm run dev
