#!/bin/sh
set -e

if [ -f ./server.js ]; then
  exec node server.js
fi

if [ -f ./frontend/server.js ]; then
  cd frontend
  exec node server.js
fi

echo "ERROR: server.js introuvable. Contenu standalone :"
find /app -maxdepth 4 -name 'server.js' 2>/dev/null || true
ls -la /app 2>/dev/null || true
exit 1
