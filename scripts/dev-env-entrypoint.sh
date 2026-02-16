#!/bin/sh
set -e

# Ensure NEXTAUTH_URL is set when toolkit provides an externally reachable app URL.
if [ -n "${APP_URL_FROM_ANYWHERE}" ]; then
  export NEXTAUTH_URL="${APP_URL_FROM_ANYWHERE}"
fi

# Release mode simulates production: build then start optimized server.
if [ "${FRONTEND_RELEASE_MODE}" = "1" ]; then
  echo "[INFO] [frontend] Release mode enabled - running npm run build && npm run start"
  npm run build
  exec npm run start
fi

exec "$@"
