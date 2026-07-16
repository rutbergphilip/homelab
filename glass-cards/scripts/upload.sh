#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
POD=$(kubectl -n home-automation get pod -l app=home-assistant -o jsonpath='{.items[0].metadata.name}')
kubectl -n home-automation exec "$POD" -c home-assistant -- mkdir -p /config/www/glass-cards/fonts
kubectl cp dist/glass-cards.js "home-automation/$POD:/config/www/glass-cards/glass-cards.js" -c home-assistant
kubectl cp node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2 \
  "home-automation/$POD:/config/www/glass-cards/fonts/outfit-variable.woff2" -c home-assistant
kubectl cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 \
  "home-automation/$POD:/config/www/glass-cards/fonts/inter-variable.woff2" -c home-assistant
echo "Uploaded bundle + fonts to $POD"
