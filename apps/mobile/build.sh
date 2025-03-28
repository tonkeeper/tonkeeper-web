#!/bin/bash
rm -f vite.log
CAPACITOR_CONFIG_FILE="./capacitor.live-reload-config.ts"

cat > "$CAPACITOR_CONFIG_FILE" <<EOL
export const server = undefined;
EOL

echo "Updated $CAPACITOR_CONFIG_FILE with the empty Vite server"

echo "Running npx cap sync..."
tsc && vite build && cap sync
