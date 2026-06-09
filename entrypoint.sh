#!/bin/sh
set -e

echo "[void] syncing database schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss

echo "[void] starting server..."
exec node server.js
