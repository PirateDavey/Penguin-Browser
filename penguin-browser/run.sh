#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install the Node.js LTS release from https://nodejs.org/ and try again."
  exit 1
fi
if [ ! -d node_modules/electron ]; then
  echo "First launch: installing Penguin Browser dependencies..."
  npm install
fi
echo "Launching Penguin Browser..."
npm start
